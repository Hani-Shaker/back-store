import nodemailer from 'nodemailer';

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
    },
  });

// منع HTML injection في الإيميلات
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeColor = (c) => (/^#[0-9A-F]{3,8}$/i.test(c || '') ? c : '#cccccc');

export const sendOrderEmail = async (order) => {
  const transporter = createTransporter();
  const total = order.total ?? order.grandTotal;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:8px">${esc(item.name)}</td>
        <td style="padding:8px;text-align:center">${esc(item.quantity)}</td>
        <td style="padding:8px;text-align:center">
          ${item.selectedColor ? `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${safeColor(item.selectedColor)};border:1px solid #ccc;vertical-align:middle"></span>` : '—'}
        </td>
        <td style="padding:8px;text-align:right">${esc(item.price)} ج.م</td>
        <td style="padding:8px;text-align:right">${esc(item.price * item.quantity)} ج.م</td>
      </tr>`
    )
    .join('');

  const c = order.customer || {};

  const html = `
    <div dir="rtl" style="font-family:Cairo,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1a7a6e,#0f4d45);padding:24px;color:#fff;text-align:center">
        <h2 style="margin:0;font-size:22px">✨ طلب جديد - Lola Store</h2>
      </div>
      <div style="padding:24px">
        <h3 style="color:#1a7a6e;border-bottom:2px solid #eee;padding-bottom:8px">📦 بيانات الطلب</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead style="background:#f5f5f5">
            <tr>
              <th style="padding:10px;text-align:right">المنتج</th>
              <th style="padding:10px;text-align:center">الكمية</th>
              <th style="padding:10px;text-align:center">اللون</th>
              <th style="padding:10px;text-align:right">السعر</th>
              <th style="padding:10px;text-align:right">الإجمالي</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-top:16px">
          <p style="margin:0 0 8px"><span>المنتجات:</span> <strong>${esc(order.totalPrice)} ج.م</strong></p>
          <p style="margin:0 0 8px"><span>التوصيل:</span> <strong>${esc(order.deliveryFee)} ج.م</strong></p>
          <p style="margin:0;font-size:18px;color:#1a7a6e;border-top:2px solid #ddd;padding-top:8px"><span>الإجمالي:</span> <strong>${esc(total)} ج.م</strong></p>
        </div>

        <h3 style="color:#1a7a6e;border-bottom:2px solid #eee;padding-bottom:8px;margin-top:24px">👤 بيانات العميل</h3>
        <table style="width:100%">
          <tr><td style="padding:6px;color:#666">الاسم:</td><td style="padding:6px;font-weight:bold">${esc(c.name)}</td></tr>
          <tr><td style="padding:6px;color:#666">الهاتف:</td><td style="padding:6px;font-weight:bold" dir="ltr">${esc(c.phone)}</td></tr>
          ${c.email ? `<tr><td style="padding:6px;color:#666">الإيميل:</td><td style="padding:6px" dir="ltr">${esc(c.email)}</td></tr>` : ''}
          <tr><td style="padding:6px;color:#666">المدينة:</td><td style="padding:6px">${esc(c.city)}</td></tr>
          <tr><td style="padding:6px;color:#666">العنوان:</td><td style="padding:6px">${esc(c.address)}</td></tr>
          ${c.notes ? `<tr><td style="padding:6px;color:#666">ملاحظات:</td><td style="padding:6px">${esc(c.notes)}</td></tr>` : ''}
        </table>
      </div>
      <div style="background:#f5f5f5;padding:16px;text-align:center;color:#999;font-size:12px">
        Lola Store © ${new Date().getFullYear()}
      </div>
    </div>`;

  await transporter.sendMail({
    from: `"Lola Store 🛍️" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL,
    subject: `🛒 طلب جديد من ${String(c.name || '').replace(/[\r\n]/g, ' ')} - ${total} ج.م`,
    html,
  });
};

export const sendContactEmail = async (contact) => {
  const transporter = createTransporter();

  const html = `
    <div dir="rtl" style="font-family:Cairo,Arial,sans-serif;max-width:500px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1a7a6e,#0f4d45);padding:20px;color:#fff;text-align:center">
        <h2 style="margin:0">📬 رسالة جديدة - اتصل بنا</h2>
      </div>
      <div style="padding:24px">
        <p><strong>الاسم:</strong> ${esc(contact.name)}</p>
        ${contact.email ? `<p><strong>الإيميل:</strong> <span dir="ltr">${esc(contact.email)}</span></p>` : ''}
        ${contact.subject ? `<p><strong>الموضوع:</strong> ${esc(contact.subject)}</p>` : ''}
        <div style="background:#f9f9f9;border-right:4px solid #1a7a6e;padding:16px;border-radius:4px;margin-top:16px">
          <p style="margin:0;line-height:1.8;white-space:pre-wrap">${esc(contact.message)}</p>
        </div>
      </div>
    </div>`;

  await transporter.sendMail({
    from: `"Lola Store 📬" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL,
    replyTo: contact.email || undefined,
    subject: `📩 رسالة جديدة من ${String(contact.name || '').replace(/[\r\n]/g, ' ')}`,
    html,
  });
};
