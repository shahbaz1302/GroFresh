export function generateOtpEmailHtml(otp: string, orderId?: string): string {
  const year = new Date().getFullYear();
  const otpDigits = otp
    .split("")
    .map(
      (d) =>
        `<span class="otp-digit">${d}</span>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your GroFresh Delivery OTP</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; color: #1a202c; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 600px; margin: 40px auto; padding: 0 16px; }
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%); border-radius: 20px 20px 0 0; padding: 40px 48px 36px; text-align: center; }
    .logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .logo-icon { font-size: 34px; line-height: 1; }
    .logo-text { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .logo-text span { color: #bbf7d0; }
    .header-tagline { font-size: 13px; color: #86efac; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500; margin-top: 4px; }
    .card { background: #ffffff; padding: 48px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
    .greeting { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .intro-text { font-size: 15px; color: #64748b; line-height: 1.7; margin-bottom: 36px; }
    .otp-section { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; border-radius: 16px; padding: 32px 24px; text-align: center; margin-bottom: 36px; }
    .otp-label { font-size: 12px; font-weight: 600; color: #16a34a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
    .otp-digits { display: inline-flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .otp-digit { display: inline-flex; align-items: center; justify-content: center; width: 58px; height: 68px; background: #ffffff; border: 2px solid #16a34a; border-radius: 12px; font-size: 32px; font-weight: 800; color: #15803d; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15); }
    .otp-expiry { margin-top: 16px; font-size: 13px; color: #6b7280; }
    .otp-expiry strong { color: #dc2626; }
    .order-info { background: #f8fafc; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; border-left: 4px solid #16a34a; }
    .order-info-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 4px; }
    .order-info-value { font-size: 15px; color: #0f172a; font-weight: 600; }
    .security-notice { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px 20px; display: flex; gap: 12px; align-items: flex-start; margin-bottom: 32px; }
    .security-icon { font-size: 20px; line-height: 1.2; flex-shrink: 0; }
    .security-text { font-size: 13px; color: #92400e; line-height: 1.6; }
    .security-text strong { color: #78350f; display: block; margin-bottom: 2px; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    .closing-text { font-size: 14px; color: #64748b; line-height: 1.7; }
    .closing-text strong { color: #0f172a; }
    .footer { background: #0f172a; border-radius: 0 0 20px 20px; padding: 32px 48px; text-align: center; }
    .footer-logo { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
    .footer-logo span { color: #4ade80; }
    .footer-links { margin: 12px 0; }
    .footer-links a { color: #94a3b8; text-decoration: none; font-size: 13px; margin: 0 10px; }
    .footer-divider { border: none; border-top: 1px solid #1e293b; margin: 16px 0; }
    .footer-copy { font-size: 12px; color: #475569; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">
        <span class="logo-icon">🛒</span>
        <span class="logo-text">Gro<span>Fresh</span></span>
      </div>
      <p class="header-tagline">Fresh Groceries · Fast Delivery</p>
    </div>
    <div class="card">
      <p class="greeting">Your Delivery OTP</p>
      <p class="intro-text">
        Your delivery agent is at your door! Please share the one-time password
        below with them to confirm and complete your delivery. This code is unique
        to your order and should only be given to your delivery agent.
      </p>
      <div class="otp-section">
        <p class="otp-label">One-Time Password</p>
        <div class="otp-digits">
          ${otpDigits}
        </div>
        <p class="otp-expiry">This code is valid for <strong>10 minutes</strong> only.</p>
      </div>
      ${
        orderId
          ? `<div class="order-info">
        <p class="order-info-label">Order Reference</p>
        <p class="order-info-value">#${orderId}</p>
      </div>`
          : ""
      }
      <div class="security-notice">
        <div class="security-text">
          <strong>Security Reminder</strong>
          Never share this OTP with anyone other than your GroFresh delivery agent.
          GroFresh support will never ask for your OTP via phone, chat, or email.
        </div>
      </div>
      <hr class="divider" />
      <p class="closing-text">
        If you did not place this order or have concerns, please
        <strong>contact our support team immediately</strong>.
        Thank you for choosing GroFresh — we hope you enjoy your fresh groceries!
      </p>
    </div>
    <div class="footer">
      <p class="footer-logo">Gro<span>Fresh</span></p>
      <div class="footer-links">
        <a href="#">Help Center</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </div>
      <hr class="footer-divider" />
      <p class="footer-copy">
        © ${year} GroFresh. All rights reserved.<br />
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
