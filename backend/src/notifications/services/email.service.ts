import nodemailer from "nodemailer";

function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(
    process.env.SMTP_PORT || 587
  );
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP email configuration is not configured"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure:
      process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER;

  if (!from) {
    throw new Error(
      "SMTP_FROM is not configured"
    );
  }

  const transporter =
    getEmailTransporter();

  const result =
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

  console.log(
    `Email sent successfully to ${options.to}`
  );

  return result;
}

export async function verifyEmailConfiguration() {
  const transporter =
    getEmailTransporter();

  await transporter.verify();

  console.log(
    "SMTP email configuration is working"
  );
}