import nodemailer from 'nodemailer'

// Create transporter - configure in .env
const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || '587')
  console.log(`[EMAIL] Creating transporter: host=${process.env.SMTP_HOST || 'smtp.gmail.com'}, port=${port}, user=${process.env.SMTP_USER || 'MISSING'}`)

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
}

// Send email
export async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter()

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  }

  const info = await transporter.sendMail(mailOptions)
  console.log('Email sent:', info.messageId)
  return info
}

// Send promotion email to multiple recipients
export async function sendPromotionEmail({ recipients, promotion, storeName }) {
  const transporter = createTransporter()

  console.log(`[EMAIL] Verifying connection...`)
  try {
    await transporter.verify()
    console.log(`[EMAIL] SMTP connection verified OK`)
  } catch (verifyErr) {
    console.error(`[EMAIL] SMTP connection FAILED:`, verifyErr.message)
    throw verifyErr
  }

  const discountText = promotion.type === 'percentage'
    ? `${promotion.value}%`
    : `${promotion.value} ج.م`

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .promo-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .promo-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 3px; font-family: monospace; }
        .discount { font-size: 24px; color: #28a745; font-weight: bold; margin: 15px 0; }
        .details { color: #666; font-size: 14px; line-height: 1.8; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 عرض خاص من ${storeName}</h1>
        </div>
        <div class="content">
          <p>عزيزي العميل،</p>
          <p>يسعدنا تقديم لكم عرض خاص حصري!</p>

          <div class="promo-box">
            <div class="discount">خصم ${discountText}</div>
            <p>استخدم كود الخصم:</p>
            <div class="promo-code">${promotion.code}</div>
          </div>

          <div class="details">
            ${promotion.min_order_amount ? `<p>📌 الحد الأدنى للطلب: ${promotion.min_order_amount} ج.م</p>` : ''}
            <p>📅 صالح حتى: ${new Date(promotion.end_date).toLocaleDateString('ar-EG')}</p>
            ${promotion.max_uses ? `<p>⏳ عدد الاستخدامات المتبقية: ${promotion.max_uses - (promotion.used_count || 0)}</p>` : ''}
          </div>

          <p style="margin-top: 20px;">سارع بالاستفادة من العرض قبل انتهائه!</p>
        </div>
        <div class="footer">
          <p>${storeName} | جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Send to all recipients
  const results = []
  for (const recipient of recipients) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient.email,
        subject: `🎉 عرض خاص: خصم ${discountText} - ${storeName}`,
        html: htmlContent,
      })
      results.push({ email: recipient.email, success: true, messageId: info.messageId })
      console.log(`Email sent to ${recipient.email}: ${info.messageId}`)
    } catch (err) {
      results.push({ email: recipient.email, success: false, error: err.message })
      console.error(`Failed to send email to ${recipient.email}:`, err.message)
    }
  }

  return results
}

// Send custom email
export async function sendCustomEmail({ recipients, subject, message, storeName }) {
  const transporter = createTransporter()

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; color: #333; line-height: 1.8; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          <p>${message}</p>
        </div>
        <div class="footer">
          <p>${storeName} | جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `

  const results = []
  for (const recipient of recipients) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient.email,
        subject,
        html: htmlContent,
      })
      results.push({ email: recipient.email, success: true })
    } catch (err) {
      results.push({ email: recipient.email, success: false, error: err.message })
    }
  }

  return results
}
