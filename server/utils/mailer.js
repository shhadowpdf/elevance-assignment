import nodemailer from "nodemailer";

const formatCurrency = (amountPaise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((amountPaise || 0) / 100);

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getMailFrom = () => ({
  fromName: process.env.SMTP_FROM_NAME || "YourTube",
  fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "",
});

export const getEmailConfigStatus = () => {
  const { fromName, fromEmail } = getMailFrom();

  return {
    hostConfigured: Boolean(process.env.SMTP_HOST),
    portConfigured: Boolean(process.env.SMTP_PORT),
    userConfigured: Boolean(process.env.SMTP_USER),
    passConfigured: Boolean(process.env.SMTP_PASS),
    fromNameConfigured: Boolean(process.env.SMTP_FROM_NAME),
    fromEmailConfigured: Boolean(process.env.SMTP_FROM_EMAIL),
    effectiveFromName: fromName,
    effectiveFromEmail: fromEmail || null,
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || null,
  };
};

const getTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export const verifyEmailTransport = async () => {
  const transporter = getTransporter();
  const config = getEmailConfigStatus();

  if (!transporter) {
    return {
      ok: false,
      error:
        "SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, and SMTP_FROM_EMAIL.",
      config,
    };
  }

  try {
    await transporter.verify();
    return {
      ok: true,
      error: null,
      config,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to verify the SMTP transport.",
      config,
    };
  }
};

const buildInvoiceEmailHtml = ({
  customerName,
  currentPlanName,
  targetPlanName,
  invoiceNumber,
  chargedAmountPaise,
  paymentId,
  orderId,
  purchasedAt,
}) => `
  <div style="font-family: Arial, sans-serif; background: #f7f4ec; padding: 32px;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5dcc8;">
      <div style="background: linear-gradient(135deg, #111827, #9a3412); color: #ffffff; padding: 28px 32px;">
        <div style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.78;">YourTube Invoice</div>
        <h1 style="margin: 12px 0 8px; font-size: 28px; line-height: 1.2;">Plan upgrade confirmed</h1>
        <p style="margin: 0; font-size: 15px; opacity: 0.88;">Lifetime access to the ${escapeHtml(targetPlanName)} plan is now active on your account.</p>
      </div>
      <div style="padding: 28px 32px; color: #1f2937;">
        <p style="margin-top: 0; font-size: 16px;">Hi ${escapeHtml(customerName || "there")},</p>
        <p style="font-size: 15px; line-height: 1.7;">
          Thank you for upgrading your YourTube plan. Your payment was successful, and the details of your invoice are below for your records.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
          <tbody>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Invoice Number</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${escapeHtml(invoiceNumber)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Previous Plan</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${escapeHtml(currentPlanName)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">New Plan</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${escapeHtml(targetPlanName)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Amount Paid</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${escapeHtml(formatCurrency(chargedAmountPaise))}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Payment ID</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${escapeHtml(paymentId)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Order ID</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${escapeHtml(orderId)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Purchased On</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${escapeHtml(formatDateTime(purchasedAt))}</td>
            </tr>
          </tbody>
        </table>
        <div style="border-radius: 16px; background: #fff7ed; border: 1px solid #fed7aa; padding: 18px 20px; font-size: 14px; line-height: 1.7;">
          Your plan purchase is a lifetime unlock for this version of YourTube. Keep this email as your invoice and confirmation of the transaction.
        </div>
      </div>
    </div>
  </div>
`;

const buildOtpEmailHtml = ({
  customerName,
  otpCode,
  expiryMinutes = 5,
}) => `
  <div style="font-family: Arial, sans-serif; background: #f7f4ec; padding: 32px;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5dcc8;">
      <div style="background: linear-gradient(135deg, #111827, #9a3412); color: #ffffff; padding: 28px 32px;">
        <div style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.78;">YourTube Verification</div>
        <h1 style="margin: 12px 0 8px; font-size: 28px; line-height: 1.2;">One-time passcode</h1>
        <p style="margin: 0; font-size: 15px; opacity: 0.88;">Use this code to complete your sign in. It expires in ${escapeHtml(String(expiryMinutes))} minutes.</p>
      </div>
      <div style="padding: 28px 32px; color: #1f2937;">
        <p style="margin-top: 0; font-size: 16px;">Hi ${escapeHtml(customerName || "there")},</p>
        <p style="font-size: 15px; line-height: 1.7;">
          Enter the following OTP on YourTube to verify your login attempt.
        </p>
        <div style="margin: 24px 0; text-align: center;">
          <div style="display: inline-block; padding: 24px 32px; border-radius: 18px; background: #f8fafc; border: 1px dashed #d1d5db; font-size: 34px; letter-spacing: 12px; font-weight: 700;">
            ${escapeHtml(otpCode)}
          </div>
        </div>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          This OTP is valid for ${escapeHtml(String(expiryMinutes))} minutes. If you did not request it, you can safely ignore this message.
        </p>
      </div>
    </div>
  </div>
`;

export const sendOtpEmail = async (
  user,
  otpCode,
  expiryMinutes = 5,
) => {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      return {
        sent: false,
        error:
          "SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, and SMTP_FROM_EMAIL.",
      };
    }

    const { fromName, fromEmail } = getMailFrom();

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: user.email,
      subject: "YourTube OTP code",
      html: buildOtpEmailHtml({
        customerName: user.name,
        otpCode,
        expiryMinutes,
      }),
    });

    return { sent: true, error: null };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unable to send OTP email.",
    };
  }
};

export const sendPlanUpgradeInvoiceEmail = async ({
  user,
  previousPlan,
  targetPlan,
  purchase,
}) => {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      return {
        sent: false,
        error:
          "SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, and SMTP_FROM_EMAIL.",
      };
    }

    const { fromName, fromEmail } = getMailFrom();

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: user.email,
      subject: `YourTube invoice ${purchase.invoiceNumber} for ${targetPlan.name}`,
      html: buildInvoiceEmailHtml({
        customerName: user.name,
        currentPlanName: previousPlan.name,
        targetPlanName: targetPlan.name,
        invoiceNumber: purchase.invoiceNumber,
        chargedAmountPaise: purchase.chargedAmountPaise,
        paymentId: purchase.razorpayPaymentId,
        orderId: purchase.razorpayOrderId,
        purchasedAt: purchase.updatedAt || new Date(),
      }),
    });

    return { sent: true, error: null };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unable to send email.",
    };
  }
};

export const sendTestPlanInvoiceEmail = async ({ email, name = "Test User" }) => {
  const transportStatus = await verifyEmailTransport();

  if (!transportStatus.ok) {
    return {
      sent: false,
      error: transportStatus.error,
      config: transportStatus.config,
      messageId: null,
    };
  }

  try {
    const transporter = getTransporter();

    if (!transporter) {
      return {
        sent: false,
        error: "SMTP transport is unavailable.",
        config: transportStatus.config,
        messageId: null,
      };
    }

    const { fromName, fromEmail } = getMailFrom();
    const mockPurchaseDate = new Date();
    const emailResult = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: "YourTube test invoice email",
      html: buildInvoiceEmailHtml({
        customerName: name,
        currentPlanName: "Free",
        targetPlanName: "Gold",
        invoiceNumber: `TEST-${mockPurchaseDate.getTime()}`,
        chargedAmountPaise: 10000,
        paymentId: "pay_test_debug_123",
        orderId: "order_test_debug_123",
        purchasedAt: mockPurchaseDate,
      }),
    });

    return {
      sent: true,
      error: null,
      config: transportStatus.config,
      messageId: emailResult.messageId || null,
    };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unable to send test email.",
      config: transportStatus.config,
      messageId: null,
    };
  }
};
