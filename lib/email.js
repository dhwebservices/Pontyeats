import { Resend } from 'resend';

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.SENDER_EMAIL || 'Ponty Eats <onboarding@resend.dev>';

const orderRow = (it) => `<tr><td style="padding:6px 0;color:#525252">${it.quantity}×</td><td style="padding:6px 0">${escapeHtml(it.name)}</td><td style="padding:6px 0;text-align:right;color:#525252">£${(Number(it.price||0)*Number(it.quantity||1)).toFixed(2)}</td></tr>`;

const escapeHtml = (s='') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const layout = (inner) => `<!doctype html><html><body style="margin:0;background:#faf6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1410">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f1;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #ece6dd">
<tr><td style="padding:24px 32px;border-bottom:1px solid #ece6dd"><table width="100%"><tr><td><span style="display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:18px"><span style="display:inline-block;width:28px;height:28px;background:#f25109;border-radius:999px;color:#fff;text-align:center;line-height:28px;font-weight:700">P</span>Ponty Eats</span></td><td align="right" style="color:#8b7d6e;font-size:12px;letter-spacing:.1em;text-transform:uppercase">Pontypridd</td></tr></table></td></tr>
<tr><td style="padding:32px">${inner}</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #ece6dd;color:#8b7d6e;font-size:12px;text-align:center">© ${new Date().getFullYear()} Ponty Eats · Made in Pontypridd</td></tr>
</table>
</td></tr></table></body></html>`;

export async function sendCustomerOrderConfirmation({ to, order, restaurant }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsHtml = items.map(orderRow).join('');
  const inner = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:600;font-family:Georgia,serif">Thanks, ${escapeHtml(order.customer_name || 'friend')} — your order's in.</h1>
    <p style="margin:0 0 24px;color:#525252">${escapeHtml(restaurant.name)} are preparing it now. We'll let you know when it's on the way.</p>
    <div style="border:1px solid #ece6dd;border-radius:10px;padding:20px;background:#faf6f1">
      <div style="font-weight:600;margin-bottom:12px">Order #${escapeHtml(order.order_number || order.id.slice(0,6))}</div>
      <table width="100%" style="font-size:14px;border-collapse:collapse">${itemsHtml}
        <tr><td colspan="2" style="padding:8px 0;border-top:1px solid #ece6dd;color:#525252">Subtotal</td><td style="padding:8px 0;border-top:1px solid #ece6dd;text-align:right">£${Number(order.subtotal||0).toFixed(2)}</td></tr>
        ${Number(order.delivery_fee||0) > 0 ? `<tr><td colspan="2" style="padding:4px 0;color:#525252">Delivery</td><td style="padding:4px 0;text-align:right">£${Number(order.delivery_fee).toFixed(2)}</td></tr>` : ''}
        <tr><td colspan="2" style="padding:8px 0;font-weight:700">Total paid</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px">£${Number(order.total||0).toFixed(2)}</td></tr>
      </table>
    </div>
    <div style="margin-top:24px;color:#525252;font-size:14px">
      <div><strong>${order.fulfillment_type === 'collection' ? 'Collection from' : 'Delivering to'}:</strong> ${escapeHtml(order.fulfillment_type === 'collection' ? (restaurant.address_line || 'restaurant') : (order.delivery_address || ''))}</div>
      ${order.delivery_notes ? `<div style="margin-top:6px"><strong>Notes:</strong> ${escapeHtml(order.delivery_notes)}</div>` : ''}
    </div>
  `;
  try {
    return await getResend().emails.send({ from: FROM, to: [to], subject: `Order confirmed at ${restaurant.name} — #${order.order_number || ''}`, html: layout(inner) });
  } catch (e) { console.error('Resend customer email failed', e); return null; }
}

export async function sendRestaurantNewOrderAlert({ to, order, restaurant }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsHtml = items.map(orderRow).join('');
  const inner = `
    <div style="background:#fef3eb;border:1px solid #f9c79b;color:#9a3412;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px;display:inline-block">New order • ${order.fulfillment_type}</div>
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:600;font-family:Georgia,serif">Order #${escapeHtml(order.order_number || '')} just landed.</h1>
    <p style="margin:0 0 24px;color:#525252">From ${escapeHtml(order.customer_name || 'a customer')}. Hop into your dashboard to accept it.</p>
    <div style="border:1px solid #ece6dd;border-radius:10px;padding:20px;background:#faf6f1">
      <table width="100%" style="font-size:14px;border-collapse:collapse">${itemsHtml}
        <tr><td colspan="2" style="padding:8px 0;border-top:1px solid #ece6dd;font-weight:700">Total</td><td style="padding:8px 0;border-top:1px solid #ece6dd;text-align:right;font-weight:700">£${Number(order.total||0).toFixed(2)}</td></tr>
        <tr><td colspan="2" style="padding:4px 0;color:#525252">Net to you (after fees)</td><td style="padding:4px 0;text-align:right;color:#525252">£${Number(order.net_amount||0).toFixed(2)}</td></tr>
      </table>
    </div>
    ${order.delivery_address ? `<div style="margin-top:18px;color:#525252;font-size:14px"><strong>Deliver to:</strong> ${escapeHtml(order.delivery_address)}</div>` : ''}
    <div style="margin-top:24px"><a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard/orders" style="display:inline-block;background:#f25109;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Open dashboard →</a></div>
  `;
  try {
    return await getResend().emails.send({ from: FROM, to: [to], subject: `🔔 New order #${order.order_number} · £${Number(order.total||0).toFixed(2)}`, html: layout(inner) });
  } catch (e) { console.error('Resend restaurant email failed', e); return null; }
}
