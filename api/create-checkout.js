import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecret = process.env.STRIPE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });

  try {
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (error || !order) return res.status(404).json({ error: 'Order not found' });

    const line_items = (order.items || []).map(item => ({
      price_data: {
        currency: 'inr',
        product_data: { name: item.name },
        unit_amount: Math.round((item.wholesalePrice || item.price || 0) * 100)
      },
      quantity: item.quantity || 1
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_BASE_URL || 'http://localhost:5175'}/SanjaySales/?checkout=success&order=${orderId}`,
      cancel_url: `${process.env.FRONTEND_BASE_URL || 'http://localhost:5175'}/SanjaySales/?checkout=cancel&order=${orderId}`,
      metadata: { orderId }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
