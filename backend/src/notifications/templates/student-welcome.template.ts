type StudentWelcomeEmailData = {
  studentName: string;
  studentId: string;
  email: string;
  packageTitle: string;
  amount: number;
  currency: string;
  courses: string[];
  loginUrl: string;
};

export function buildStudentWelcomeEmail(
  data: StudentWelcomeEmailData
) {
  const courseList = data.courses
    .map(
      (course) =>
        `<li style="margin-bottom:8px;">${course}</li>`
    )
    .join("");

  const textCourseList =
    data.courses.length > 0
      ? data.courses
          .map(
            (course) => `- ${course}`
          )
          .join("\n")
      : "Courses will be available in your student portal.";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to SK Computer Education</title>
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
        Welcome to SKCE!
      </h1>

      <p
        style="
          margin:12px 0 0;
          color:#dbeafe;
          font-size:15px;
        "
      >
        Your registration has been completed successfully.
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
        Dear <strong>${data.studentName}</strong>,
      </p>

      <p
        style="
          font-size:15px;
          line-height:1.7;
          color:#475569;
        "
      >
        We are happy to welcome you to the
        <strong>SK Computer Education</strong> family.
        Your payment has been successfully verified
        and your student account has been created.
      </p>

      <!-- Success -->

      <div
        style="
          margin:25px 0;
          padding:18px;
          border-radius:12px;
          background:#f0fdf4;
          border:1px solid #bbf7d0;
        "
      >

        <div
          style="
            color:#15803d;
            font-size:17px;
            font-weight:bold;
          "
        >
          ✓ Payment Successful
        </div>

        <p
          style="
            margin:8px 0 0;
            color:#166534;
            font-size:14px;
          "
        >
          Your payment of
          <strong>
            ${data.currency} ${data.amount.toLocaleString("en-IN")}
          </strong>
          has been successfully recorded.
        </p>

      </div>

      <!-- Student Details -->

      <h2
        style="
          color:#173B67;
          font-size:20px;
          margin-top:30px;
        "
      >
        Your Student Details
      </h2>

      <table
        style="
          width:100%;
          border-collapse:collapse;
          font-size:14px;
        "
      >

        <tr>
          <td
            style="
              padding:12px;
              border-bottom:1px solid #e2e8f0;
              color:#64748b;
            "
          >
            Student ID
          </td>

          <td
            style="
              padding:12px;
              border-bottom:1px solid #e2e8f0;
              font-weight:bold;
              color:#173B67;
            "
          >
            ${data.studentId}
          </td>
        </tr>

        <tr>
          <td
            style="
              padding:12px;
              border-bottom:1px solid #e2e8f0;
              color:#64748b;
            "
          >
            Registered Email
          </td>

          <td
            style="
              padding:12px;
              border-bottom:1px solid #e2e8f0;
              font-weight:bold;
            "
          >
            ${data.email}
          </td>
        </tr>

        <tr>
          <td
            style="
              padding:12px;
              border-bottom:1px solid #e2e8f0;
              color:#64748b;
            "
          >
            Package
          </td>

          <td
            style="
              padding:12px;
              border-bottom:1px solid #e2e8f0;
              font-weight:bold;
            "
          >
            ${data.packageTitle}
          </td>
        </tr>

        <tr>
          <td
            style="
              padding:12px;
              border-bottom:1px solid #e2e8f0;
              color:#64748b;
            "
          >
            Enrollment Status
          </td>

          <td
            style="
              padding:12px;
              border-bottom:1px solid #e2e8f0;
              font-weight:bold;
              color:#15803d;
            "
          >
            ACTIVE
          </td>
        </tr>

      </table>

      <!-- Courses -->

      <h2
        style="
          color:#173B67;
          font-size:20px;
          margin-top:30px;
        "
      >
        Your Learning Areas
      </h2>

      <div
        style="
          padding:18px;
          background:#f8fafc;
          border-radius:12px;
          border:1px solid #e2e8f0;
        "
      >

        <ul
          style="
            margin:0;
            padding-left:22px;
            color:#475569;
            font-size:14px;
            line-height:1.6;
          "
        >
          ${courseList}
        </ul>

      </div>

      <!-- Login -->

      <div
        style="
          margin-top:30px;
          padding:22px;
          background:#eff6ff;
          border:1px solid #bfdbfe;
          border-radius:12px;
          text-align:center;
        "
      >

        <p
          style="
            margin:0 0 15px;
            font-size:15px;
            color:#334155;
          "
        >
          You can now access your student portal.
        </p>

        <a
          href="${data.loginUrl}"
          style="
            display:inline-block;
            padding:12px 24px;
            background:#F97316;
            color:#ffffff;
            text-decoration:none;
            border-radius:8px;
            font-weight:bold;
          "
        >
          Login to Student Portal
        </a>

        <p
          style="
            margin:15px 0 0;
            font-size:12px;
            color:#64748b;
          "
        >
          Login using the email address and password
          you created during registration.
        </p>

      </div>

      <p
        style="
          margin-top:30px;
          font-size:15px;
          line-height:1.7;
          color:#475569;
        "
      >
        We are happy to have you with us and wish you
        great success in your learning journey.
      </p>

      <p
        style="
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
      © SK Computer Education. All rights reserved.
    </div>

  </div>

</body>
</html>
`;

  const text = `
Dear ${data.studentName},

Welcome to SK Computer Education!

Your registration and payment have been successfully completed.

STUDENT DETAILS
----------------
Student ID: ${data.studentId}
Registered Email: ${data.email}
Package: ${data.packageTitle}
Enrollment Status: ACTIVE
Amount Paid: ${data.currency} ${data.amount.toLocaleString("en-IN")}

YOUR LEARNING AREAS
-------------------
${textCourseList}

LOGIN
-----
${data.loginUrl}

Use your registered email address and the password you created during registration.

We are happy to have you with us and wish you great success in your learning journey.

Regards,
SK Computer Education
`;

  return {
    html,
    text,
  };
}