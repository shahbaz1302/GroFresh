import nodemailer from "nodemailer";

export const sendMail = async (to: string, subject: string, html: string) => {
  if (!to || typeof to !== "string" || !to.includes("@")) {
    throw new Error(`Invalid recipient email address: "${to}"`);
  }

  const emailUser = process.env.EMAIL;
  const emailPass = process.env.PASS ? process.env.PASS.replace(/\s+/g, "") : "";

  if (!emailUser || !emailPass) {
    throw new Error(
      "Missing EMAIL or PASS environment variables for nodemailer transporter.",
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailPass },
  });

  console.log(`[sendMail] Sending email to ${to} (Subject: "${subject}")`);

  const info = await transporter.sendMail({
    from: `"GroFresh Administrator" <${emailUser}>`,
    to: to.trim(),
    subject,
    html,
  });

  console.log(
    `[sendMail] Sent successfully to ${to}, messageId: ${info.messageId}`,
  );
  return info;
};
