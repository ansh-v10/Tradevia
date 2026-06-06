import 'dotenv/config';
import http from 'node:http';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

const port = Number(process.env.API_PORT || 8787);
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const razorKeyId = process.env.RAZORPAY_KEY_ID;
const razorKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!supabaseUrl || !supabaseServiceKey || !razorKeyId || !razorKeySecret) {
  console.error('Missing required env vars for apiServer. Check VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_ID, and RAZORPAY_KEY_SECRET.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const razor = new Razorpay({ key_id: razorKeyId, key_secret: razorKeySecret });

// Optional SMTP for email notifications
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const adminEmail = process.env.ADMIN_EMAIL;

let transporter = null;
if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });
  transporter.verify().then(() => {
    console.log('Email transport ready');
  }).catch((err) => {
    console.warn('Email transport not available:', err.message);
    transporter = null;
  });
}

function formatOrderItems(items) {
  return (items || []).map(i =>
    `  ${i.name} x ${i.quantity} = ₹${((i.wholesalePrice || i.price || 0) * (i.quantity || 0)).toLocaleString('en-IN')}`
  ).join('\n');
}

function buildOrderEmailHtml(order, customerEmail) {
  const items = order.items || [];
  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd">${i.name}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">₹${((i.wholesalePrice || i.price || 0) * (i.quantity || 0)).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const addr = order.address || {};
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#1e3a5f;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
    <h2 style="margin:0">Sanjay Sales</h2>
    <p style="margin:4px 0 0;opacity:0.9">B2B Wholesale Order Confirmation</p>
  </div>
  <div style="border:1px solid #ddd;border-top:0;padding:20px;border-radius:0 0 8px 8px">
    <p>Thank you for your order!</p>
    <p><strong>Order ID:</strong> ${order.id}</p>
    <p><strong>Date:</strong> ${new Date(order.paid_at || order.created_at || Date.now()).toLocaleString('en-IN')}</p>
    <p><strong>Status:</strong> <span style="color:#16a34a;font-weight:bold">Paid</span></p>

    <h3 style="margin-top:24px">Items</h3>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:8px;text-align:left">Product</th>
          <th style="padding:8px;text-align:center">Qty</th>
          <th style="padding:8px;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div style="margin-top:16px;border-top:2px solid #1e3a5f;padding-top:8px">
      <p><strong>Subtotal:</strong> ₹${(order.raw_subtotal || 0).toLocaleString('en-IN')}</p>
      <p><strong>GST (18%):</strong> ₹${(order.gst || 0).toLocaleString('en-IN')}</p>
      ${order.discount > 0 ? `<p><strong>Discount:</strong> -₹${(order.discount || 0).toLocaleString('en-IN')}</p>` : ''}
      <p style="font-size:18px"><strong>Total Paid:</strong> ₹${(order.amount || 0).toLocaleString('en-IN')}</p>
    </div>

    <h3 style="margin-top:24px">Delivery Address</h3>
    <p>${addr.name || ''}<br>${addr.businessName || ''}<br>${addr.addressLine || ''}<br>${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}<br>Phone: ${addr.phone || ''}</p>

    <p style="margin-top:24px;color:#666;font-size:12px">This is an automated confirmation from Sanjay Sales B2B portal.</p>
  </div>
</body>
</html>`;
}

async function sendOrderEmails(orderId) {
  if (!transporter) return;

  try {
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) return;

    let customerEmail = '';
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', order.user_id)
        .maybeSingle();
      customerEmail = profile?.email || '';
    }
    const emailHtml = buildOrderEmailHtml(order, customerEmail);

    // Send to customer
    if (customerEmail) {
      await transporter.sendMail({
        from: `"Sanjay Sales" <${smtpUser}>`,
        to: customerEmail,
        subject: `Order Confirmed — ${order.id}`,
        html: emailHtml
      });
      console.log(`Order confirmation sent to ${customerEmail}`);
    }

    // Send to admin
    if (adminEmail) {
      await transporter.sendMail({
        from: `"Sanjay Sales" <${smtpUser}>`,
        to: adminEmail,
        subject: `New Order — ${order.id}`,
        html: emailHtml
      });
      console.log(`Admin notification sent to ${adminEmail}`);
    }
  } catch (err) {
    console.error('Failed to send order emails:', err.message);
  }
}

async function updateOrderWithFallback(orderId, primaryPayload, fallbackPayload) {
  const { error } = await supabase.from('orders').update(primaryPayload).eq('id', orderId);
  if (error && fallbackPayload) {
    await supabase.from('orders').update(fallbackPayload).eq('id', orderId);
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 10_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/create-razorpay-order') {
    try {
      const body = await readBody(req);
      const { orderId, amount } = body;
      if (!orderId) return sendJson(res, 400, { error: 'orderId required' });

      let amountPaise = Math.round((Number(amount) || 0) * 100);

      if (!amountPaise) {
        const { data: order, error } = await supabase.from('orders').select('amount').eq('id', orderId).single();
        if (error || !order) return sendJson(res, 404, { error: 'Order not found' });
        amountPaise = Math.round((Number(order.amount) || 0) * 100);
      }

      const rOrder = await razor.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: orderId,
        payment_capture: 1
      });

      await updateOrderWithFallback(
        orderId,
        {
          status: 'payment_initiated',
          razorpay_order_id: rOrder.id,
          payment_initiated_at: new Date().toISOString()
        },
        { status: 'payment_initiated' }
      );

      return sendJson(res, 200, { order_id: rOrder.id, amount: rOrder.amount, key_id: razorKeyId });
    } catch (error) {
      console.error(error);
      return sendJson(res, 500, { error: error.message });
    }
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/razorpay-verify') {
    try {
      const body = await readBody(req);
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = body;
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
        return sendJson(res, 400, { error: 'missing params' });
      }

      const generatedSig = crypto
        .createHmac('sha256', razorKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSig !== razorpay_signature) {
        return sendJson(res, 400, { success: false, error: 'Invalid signature' });
      }

      await updateOrderWithFallback(
        orderId,
        {
          status: 'paid',
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id,
          paid_at: new Date().toISOString()
        },
        { status: 'paid' }
      );

      // Decrement inventory for each ordered item
      try {
        const { data: paidOrder } = await supabase.from('orders').select('items').eq('id', orderId).single();
        if (paidOrder?.items) {
          for (const item of paidOrder.items) {
            const qty = Number(item.quantity) || 0;
            if (qty > 0 && item.id) {
              await supabase.rpc('decrement_product_inventory', { product_id: item.id, quantity: qty });
            }
          }
        }
      } catch (invErr) {
        console.error('Inventory decrement failed (non-fatal):', invErr);
      }

      // Send confirmation emails (non-blocking)
      sendOrderEmails(orderId).catch(() => {});

      return sendJson(res, 200, { success: true });
    } catch (error) {
      console.error(error);
      return sendJson(res, 500, { success: false, error: error.message });
    }
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/razorpay-payment-failed') {
    try {
      const body = await readBody(req);
      const { orderId, reason } = body;
      if (!orderId) return sendJson(res, 400, { error: 'orderId required' });

      await updateOrderWithFallback(
        orderId,
        {
          status: 'payment_failed',
          failure_reason: reason || 'dismissed_or_failed',
          failed_at: new Date().toISOString()
        },
        { status: 'payment_failed' }
      );

      return sendJson(res, 200, { success: true });
    } catch (error) {
      console.error(error);
      return sendJson(res, 500, { success: false, error: error.message });
    }
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/upload-image') {
    try {
      const body = await readBody(req);
      const { fileName, base64Data } = body;
      if (!base64Data) return sendJson(res, 400, { error: 'base64Data required' });

      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find((b) => b.name === 'product-images')) {
        await supabase.storage.createBucket('product-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5 * 1024 * 1024
        });
        console.log('Created storage bucket: product-images');
      }

      // Extract MIME type and raw base64 from data URL
      let mimeType = 'image/jpeg';
      let rawBase64 = base64Data;
      if (base64Data.startsWith('data:')) {
        const semicolon = base64Data.indexOf(';');
        const comma = base64Data.indexOf(',');
        if (semicolon > 0 && comma > 0) {
          mimeType = base64Data.slice(5, semicolon);
          rawBase64 = base64Data.slice(comma + 1);
        }
      }

      const buffer = Buffer.from(rawBase64, 'base64');
      const ext = mimeType.split('/')[1] || 'jpg';
      const storageName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(storageName, buffer, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) {
        return sendJson(res, 500, { error: uploadError.message });
      }

      const { data: publicUrl } = supabase.storage
        .from('product-images')
        .getPublicUrl(storageName);

      return sendJson(res, 200, { url: publicUrl.publicUrl });
    } catch (error) {
      console.error('Upload error:', error);
      return sendJson(res, 500, { error: error.message });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
