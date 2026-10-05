type PasswordResetEmailData = {
  userName: string;
  resetUrl: string;
};

export function buildPasswordResetEmail(
  data: PasswordResetEmailData
) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Reset Your Password - SK Computer Education</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f8fafc;
    font-family:Arial,Helvetica,sans-serif;
    color:#102A43;
  "
>

  <div
    style="
      max-width:680px;
      margin:30px auto;
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      border:1px solid #e2e8f0;
    "
  >

    <!-- Header -->

    <div
      style="
        background:#173B67;
        padding:35px 30px;
        text-align:center;
        color:#ffffff;
      "
    >

      <div
        style="
          color:#F97316;
          font-size:16px;
          font-weight:bold;
          margin-bottom:10px;
        "
      >
        SK Computer Education
      </div>

      <h1
        style="
          margin:0;
          font-size:30px;
          line-height:1.3;
        "
      >
        Reset Your Password
      </h1>

      <p
        style="
          margin:12px 0 0;
          color:#dbeafe;
          font-size:15px;
        "
      >
        Password reset request received.
      </p>

    </div>

    <!-- Body -->

    <div style="padding:30px;">

      <p
        style="
          font-size:16px;
          line-height:1.7;
          margin-top:0;
        "
      >
        Dear <strong>${data.userName}</strong>,
      </p>

      <p
        style="
          font-size:15px;
          line-height:1.7;
          color:#475569;
        "
      >
        We received a request to reset the password
        for your <strong>SK Computer Education</strong>
        account.
      </p>

      <!-- Reset Action -->

      <div
        style="
          margin:25px 0;
          padding:24px;
          border-radius:12px;
          background:#eff6ff;
          border:1px solid #bfdbfe;
          text-align:center;
        "
      >

        <p
          style="
            margin:0 0 18px;
            font-size:15px;
            line-height:1.6;
            color:#334155;
          "
        >
          Click the button below to create a new password.
        </p>

        <a
          href="${data.resetUrl}"
          style="
            display:inline-block;
            padding:13px 28px;
            background:#F97316;
            color:#ffffff;
            text-decoration:none;
            border-radius:8px;
            font-weight:bold;
            font-size:15px;
          "
        >
          Reset Password
        </a>

      </div>

      <!-- Expiry -->

      <div
        style="
          margin:25px 0;
          padding:18px;
          border-radius:12px;
          background:#fff7ed;
          border:1px solid #fed7aa;
        "
      >

        <div
          style="
            color:#c2410c;
            font-size:15px;
            font-weight:bold;
          "
        >
          Important
        </div>

        <p
          style="
            margin:8px 0 0;
            color:#9a3412;
            font-size:14px;
            line-height:1.6;
          "
        >
          This password reset link is valid for
          <strong>30 minutes</strong>.
          After that, you will need to request a new
          password reset link.
        </p>

      </div>

      <!-- Security Notice -->

      <p
        style="
          margin-top:28px;
          font-size:14px;
          line-height:1.7;
          color:#64748b;
        "
      >
        If you did not request a password reset,
        you can safely ignore this email.
        Your current password will remain unchanged.
      </p>

      <p
        style="
          margin-top:20px;
          font-size:13px;
          line-height:1.7;
          color:#94a3b8;
        "
      >
        For your security, please do not share this
        password reset link with anyone.
      </p>

      <p
        style="
          margin-top:30px;
          margin-bottom:0;
          font-size:14px;
          color:#475569;
        "
      >
        Regards,<br />
        <strong>SK Computer Education</strong>
      </p>

    </div>

    <!-- Footer -->

    <div
      style="
        background:#f8fafc;
        padding:20px 30px;
        text-align:center;
        border-top:1px solid #e2e8f0;
        color:#94a3b8;
        font-size:12px;
      "
    >
      &copy; SK Computer Education. All rights reserved.
    </div>

  </div>

</body>
</html>
`;

  const text = `
Dear ${data.userName},

We received a request to reset the password for your SK Computer Education account.

Reset your password using the link below:

${data.resetUrl}

IMPORTANT
---------
This password reset link is valid for 30 minutes.
After that, you will need to request a new password reset link.

If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.

For your security, please do not share this password reset link with anyone.

Regards,
SK Computer Education
`;

  return {
    html,
    text,
  };
}