import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  const body = req.body || '';
  const signature = req.headers['x-razorpay-signature'];
  if (!signature || !webhookSecret) return res.status(400).end();

  const expected = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(body)).digest('hex');
  if (expected !== signature) return res.status(400).end('Invalid signature');

  const event = body.event;
  if (event === 'payment.captured' || event === 'order.paid') {
    const payload = body.payload || {};
    const payment = payload.payment ? payload.payment.entity : null;
    const notes = payment?.notes || {};
    const receipt = notes.receipt || payment?.order_id || null;
    if (receipt) {
      try {
        await supabase.from('orders').update({ status: 'paid' }).eq('id', receipt);
      } catch (err) {
        console.error('Webhook update failed', err);
      }
    }
  }

  res.status(200).json({ received: true });
}
