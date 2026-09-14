import "dotenv/config";

import {
  verifyEmailConfiguration,
  sendEmail,
} from "./services/email.service";

async function testEmail() {
  try {
    console.log("Checking SMTP configuration...");

    await verifyEmailConfiguration();

    console.log("SMTP configuration verified.");

    const recipient = process.env.SMTP_USER;

    if (!recipient) {
      throw new Error(
        "SMTP_USER is not configured in .env"
      );
    }

    await sendEmail({
      to: recipient,

      subject:
        "SK Computer Education - Email Test",

      text:
        "This is a test email from SK Computer Education.",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        ">

          <h2 style="margin-bottom: 10px;">
            SK Computer Education
          </h2>

          <p>
            Hello,
          </p>

          <p>
            This is a test email from the
            SK Computer Education backend.
          </p>

          <p>
            Your SMTP configuration is working
            successfully.
          </p>

          <p style="
            margin-top: 25px;
            font-size: 13px;
            color: #6b7280;
          ">
            This is an automated test email.
          </p>

        </div>
      `,
    });

    console.log("Test email sent successfully.");
  } catch (error) {
    console.error(
      "Email test failed:",
      error
    );

    process.exitCode = 1;
  }
}

testEmail();