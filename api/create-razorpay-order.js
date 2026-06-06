import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const razorKeyId = process.env.RAZORPAY_KEY_ID;
const razorKeySecret = process.env.RAZORPAY_KEY_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const razor = new Razorpay({ key_id: razorKeyId, key_secret: razorKeySecret });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });

  try {
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (error || !order) return res.status(404).json({ error: 'Order not found' });

    const amountPaise = Math.round((Number(order.amount) || 0) * 100);
    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: orderId,
      payment_capture: 1
    };

    const rOrder = await razor.orders.create(options);

    return res.status(200).json({ order_id: rOrder.id, amount: rOrder.amount, key_id: razorKeyId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
