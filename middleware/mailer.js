import nodemailer from 'nodemailer';

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

export const sendOrderEmail = async (order) => {
  const transporter = createTransporter();

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:8px">${item.name}</td>
        <td style="padding:8px;text-align:center">${item.quantity}</td>
        <td style="padding:8px;text-align:center">
          <span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${item.selectedColor};border:1px solid #ccc;vertical-align:middle"></span>
        </td>
        <td style="padding:8px;text-align:right">${item.price * item.quantity} ج.م</td>
      </tr>`
    )
    .join('');

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
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-top:16px">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span>المنتجات:</span><strong>${order.totalPrice} ج.م</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span>التوصيل:</span><strong>${order.deliveryFee} ج.م</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:18px;color:#1a7a6e;border-top:2px solid #ddd;padding-top:8px">
            <span>الإجمالي:</span><strong>${order.grandTotal} ج.م</strong>
          </div>
        </div>
        
        <h3 style="color:#1a7a6e;border-bottom:2px solid #eee;padding-bottom:8px;margin-top:24px">👤 بيانات العميل</h3>
        <table style="width:100%">
          <tr><td style="padding:6px;color:#666">الاسم:</td><td style="padding:6px;font-weight:bold">${order.customer.name}</td></tr>
          <tr><td style="padding:6px;color:#666">الهاتف:</td><td style="padding:6px;font-weight:bold" dir="ltr">${order.customer.phone}</td></tr>
          ${order.customer.email ? `<tr><td style="padding:6px;color:#666">الإيميل:</td><td style="padding:6px" dir="ltr">${order.customer.email}</td></tr>` : ''}
          <tr><td style="padding:6px;color:#666">المدينة:</td><td style="padding:6px">${order.customer.city}</td></tr>
          <tr><td style="padding:6px;color:#666">العنوان:</td><td style="padding:6px">${order.customer.address}</td></tr>
          ${order.customer.notes ? `<tr><td style="padding:6px;color:#666">ملاحظات:</td><td style="padding:6px">${order.customer.notes}</td></tr>` : ''}
        </table>
      </div>
      <div style="background:#f5f5f5;padding:16px;text-align:center;color:#999;font-size:12px">
        Lola Store © ${new Date().getFullYear()}
      </div>
    </div>`;

  await transporter.sendMail({
    from: `"Lola Store 🛍️" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL,
    subject: `🛒 طلب جديد من ${order.customer.name} - ${order.grandTotal} ج.م`,
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
        <p><strong>الاسم:</strong> ${contact.name}</p>
        ${contact.email ? `<p><strong>الإيميل:</strong> <span dir="ltr">${contact.email}</span></p>` : ''}
        <div style="background:#f9f9f9;border-right:4px solid #1a7a6e;padding:16px;border-radius:4px;margin-top:16px">
          <p style="margin:0;line-height:1.8">${contact.message}</p>
        </div>
      </div>
    </div>`;

  await transporter.sendMail({
    from: `"Lola Store 📬" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL,
    subject: `📩 رسالة جديدة من ${contact.name}`,
    html,
  });
};
