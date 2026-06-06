import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const razorKeySecret = process.env.RAZORPAY_KEY_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) return res.status(400).json({ error: 'missing params' });

  const generatedSig = crypto.createHmac('sha256', razorKeySecret).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
  if (generatedSig !== razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Invalid signature' });
  }

  try {
    await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
