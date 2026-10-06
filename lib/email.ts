import nodemailer from "nodemailer";

export interface PasswordSetupEmailData {
  ownerName: string;
  ownerEmail: string;
  setupUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendPasswordSetupEmail({
  ownerName,
  ownerEmail,
  setupUrl,
}: PasswordSetupEmailData) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  const smtpSecure = process.env.SMTP_SECURE === "true";

  /*
   * DEVELOPMENT FALLBACK
   *
   * If SMTP is not configured locally, we don't block the approval flow.
   * The setup URL will be printed in the terminal.
   *
   * In production, missing SMTP configuration is treated as an error.
   */
  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    if (process.env.NODE_ENV !== "production") {
      console.log("========================================");
      console.log("PASSWORD SETUP EMAIL - DEVELOPMENT MODE");
      console.log("========================================");
      console.log("Owner:", ownerName);
      console.log("Email:", ownerEmail);
      console.log("Setup URL:", setupUrl);
      console.log("========================================");

      return {
        success: true,
        mode: "development",
      };
    }

    throw new Error(
      "SMTP email configuration is incomplete. Please configure SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM."
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const safeOwnerName = escapeHtml(ownerName);
  const safeSetupUrl = escapeHtml(setupUrl);

  const text = `
Hello ${ownerName},

Your Restova restaurant owner account has been created.

Please use the link below to create your password:

${setupUrl}

This link is valid for 24 hours.

If you did not request this account, you can safely ignore this email.

Regards,
Restova Team
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Set up your Restova account</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background-color: #f4f4f5;
    font-family: Arial, Helvetica, sans-serif;
  "
>
  <div
    style="
      width: 100%;
      padding: 40px 16px;
      box-sizing: border-box;
    "
  >
    <div
      style="
        max-width: 560px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #e4e4e7;
      "
    >

      <!-- Header -->
      <div
        style="
          background: #111827;
          padding: 28px 32px;
          text-align: center;
        "
      >
        <h1
          style="
            margin: 0;
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
          "
        >
          Restova
        </h1>

        <p
          style="
            margin: 8px 0 0;
            color: #d1d5db;
            font-size: 14px;
          "
        >
          Restaurant Management Platform
        </p>
      </div>

      <!-- Content -->
      <div style="padding: 36px 32px;">

        <h2
          style="
            margin: 0 0 16px;
            color: #18181b;
            font-size: 24px;
          "
        >
          Welcome to Restova
        </h2>

        <p
          style="
            margin: 0 0 16px;
            color: #52525b;
            font-size: 15px;
            line-height: 1.7;
          "
        >
          Hello ${safeOwnerName},
        </p>

        <p
          style="
            margin: 0 0 20px;
            color: #52525b;
            font-size: 15px;
            line-height: 1.7;
          "
        >
          Your restaurant owner account has been created successfully.
          To access your Restova dashboard, you first need to create
          your account password.
        </p>

        <!-- Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a
            href="${safeSetupUrl}"
            style="
              display: inline-block;
              padding: 14px 28px;
              background: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
            "
          >
            Create Password
          </a>
        </div>

        <p
          style="
            margin: 0 0 12px;
            color: #71717a;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          This password setup link is valid for
          <strong>24 hours</strong>.
        </p>

        <p
          style="
            margin: 0 0 24px;
            color: #71717a;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          If the button above does not work, copy and paste the following
          link into your browser:
        </p>

        <div
          style="
            padding: 12px;
            background: #f4f4f5;
            border-radius: 8px;
            word-break: break-all;
            font-size: 12px;
            color: #52525b;
          "
        >
          ${safeSetupUrl}
        </div>

        <p
          style="
            margin: 28px 0 0;
            color: #71717a;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          If you did not request this account, you can safely ignore
          this email.
        </p>

      </div>

      <!-- Footer -->
      <div
        style="
          padding: 20px 32px;
          background: #fafafa;
          border-top: 1px solid #e4e4e7;
          text-align: center;
        "
      >
        <p
          style="
            margin: 0;
            color: #a1a1aa;
            font-size: 12px;
          "
        >
          © ${new Date().getFullYear()} Restova. All rights reserved.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`.trim();

  await transporter.sendMail({
    from: smtpFrom,
    to: ownerEmail,
    subject: "Set up your Restova restaurant owner account",
    text,
    html,
    ...(process.env.SMTP_REPLY_TO
      ? { replyTo: process.env.SMTP_REPLY_TO }
      : {}),
  });

  return {
    success: true,
    mode: "smtp",
  };
}