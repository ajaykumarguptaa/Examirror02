import nodemailer from 'nodemailer';

/**
 * Brevo (formerly Sendinblue) SMTP Transporter Setup
 */
export const getEmailTransporter = () => {
  const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER;
  const pass = process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASSWORD;

  // If credentials are placeholders or missing, return null to use safe dev fallback
  if (!user || !pass || pass === 'password' || user === 'user') {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587 (STARTTLS)
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
};

/**
 * Sends a 6-digit verification OTP to a student email via Brevo SMTP
 * Includes rich student profile details, security warnings, and brand aesthetics.
 */
export const sendStudentRegistrationOtpEmail = async (
  toEmail: string,
  otpCode: string,
  firstName?: string,
  lastName?: string,
  phone?: string
): Promise<{ success: boolean; messageId?: string; mode: 'smtp' | 'dev_mock' }> => {
  const transporter = getEmailTransporter();
  const cleanFirst = firstName?.trim() || 'Candidate';
  const cleanLast = lastName?.trim() || '';
  const fullName = cleanLast ? `${cleanFirst} ${cleanLast}` : cleanFirst;
  const formattedPhone = phone ? (phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\D/g, '')}`) : 'Not Provided';
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM || 'Examirror <examirror1@gmail.com>';

  // Format request timestamp in Indian Standard Time (IST)
  let requestTimestamp = '';
  try {
    requestTimestamp = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date()) + ' IST';
  } catch {
    requestTimestamp = new Date().toLocaleString() + ' UTC';
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${otpCode} - Examirror Account Verification</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            
            <!-- Main Container -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border: 1px solid #e2e8f0;">
              
              <!-- Top Gradient Brand Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%); padding: 36px 32px 30px; text-align: center;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <span style="display: inline-block; padding: 4px 14px; background-color: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #e0e7ff; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                          ★ ISO 9001:2015 CERTIFIED PORTAL ★
                        </span>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                          EXAMIRROR
                        </h1>
                        <p style="margin: 6px 0 0; font-size: 13px; color: #c7d2fe; font-weight: 500; letter-spacing: 0.5px;">
                          Online Test Series & Learning Platform
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Email Body -->
              <tr>
                <td style="padding: 32px 28px 24px;">
                  
                  <!-- Greeting & Intro -->
                  <h2 style="margin: 0 0 10px; font-size: 20px; font-weight: 800; color: #0f172a;">
                    Dear ${fullName},
                  </h2>
                  <p style="margin: 0 0 22px; font-size: 14.5px; line-height: 1.6; color: #475569;">
                    Thank you for initiating your student registration on <strong>Examirror</strong>. To complete your account activation and access your online mock tests, please enter the One-Time Password (OTP) provided below.
                  </p>

                  <!-- Big Prominent OTP Card -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 16px 0 26px;">
                    <tr>
                      <td align="center" style="background: linear-gradient(180deg, #f5f3ff 0%, #eef2ff 100%); border: 2px dashed #6366f1; border-radius: 14px; padding: 24px 16px;">
                        <span style="display: block; font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #4f46e5; margin-bottom: 6px;">
                          Your 6-Digit Verification Code
                        </span>
                        <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #1e1b4b; font-family: 'SF Mono', Monaco, Menlo, Consolas, 'Courier New', monospace; padding: 6px 0 10px 12px; line-height: 1.2;">
                          ${otpCode}
                        </div>
                        <span style="display: inline-block; background-color: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px;">
                          ⏱ Valid for 10 minutes only
                        </span>
                        <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">
                          Enter this code on the registration screen to activate your account.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Student Profile Details Card -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #f8fafc;">
                    <tr>
                      <td colspan="2" style="background-color: #f1f5f9; padding: 12px 18px; border-bottom: 1px solid #e2e8f0;">
                        <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #334155;">
                          📋 Candidate Registration Details
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 18px; font-size: 13px; font-weight: 600; color: #64748b; width: 38%; border-bottom: 1px solid #eef2f6;">
                        Candidate Name:
                      </td>
                      <td style="padding: 10px 18px; font-size: 13.5px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #eef2f6;">
                        ${fullName}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #eef2f6;">
                        Registered Email:
                      </td>
                      <td style="padding: 10px 18px; font-size: 13.5px; font-weight: 700; color: #4338ca; border-bottom: 1px solid #eef2f6; word-break: break-all;">
                        ${toEmail}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #eef2f6;">
                        Mobile Number:
                      </td>
                      <td style="padding: 10px 18px; font-size: 13.5px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #eef2f6;">
                        ${formattedPhone}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 18px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #eef2f6;">
                        Portal Access:
                      </td>
                      <td style="padding: 10px 18px; font-size: 13.5px; font-weight: 600; color: #059669; border-bottom: 1px solid #eef2f6;">
                        Student (Mock Test Series & E-Notes)
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 18px; font-size: 13px; font-weight: 600; color: #64748b;">
                        Request Time:
                      </td>
                      <td style="padding: 10px 18px; font-size: 12.5px; font-weight: 500; color: #475569;">
                        ${requestTimestamp}
                      </td>
                    </tr>
                  </table>

                  <!-- What You Get Section -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #f8fafc; border-radius: 12px; padding: 16px 18px; border: 1px solid #e2e8f0;">
                    <tr>
                      <td>
                        <span style="display: block; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #334155; margin-bottom: 10px;">
                          🚀 What You Unlock with Examirror:
                        </span>
                        <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; color: #475569;">
                          <li><strong>Full-Length Online Mock Tests:</strong> Latest exam patterns (SSC, Banking, Teaching, Railways & Police).</li>
                          <li><strong>Live All-India Ranking:</strong> Instant percentile, speed analysis, and sectional breakdown.</li>
                          <li><strong>Comprehensive Solutions:</strong> Detailed step-by-step answers for every question.</li>
                          <li><strong>Study Materials & E-Notes:</strong> Free curated revision guides and current affairs.</li>
                        </ul>
                      </td>
                    </tr>
                  </table>

                  <!-- Security Warning -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;">
                    <tr>
                      <td>
                        <strong style="color: #92400e; font-size: 12.5px; display: block; margin-bottom: 4px;">
                          🔒 Important Security Notice:
                        </strong>
                        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #78350f;">
                          Never share your OTP or password with anyone, including anyone claiming to be from Examirror. Examirror staff will never ask for your verification code. If you did not initiate this request, please ignore this email.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #334155;">
                    Examirror Education & Skill Development
                  </p>
                  <p style="margin: 0 0 8px; font-size: 11.5px; color: #64748b; line-height: 1.4;">
                    Empowering students nationwide with state-of-the-art mock examinations and learning solutions.
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    This is an automated system email. Replies to this email address are not monitored.<br>
                    © ${new Date().getFullYear()} Examirror. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const plainTextContent = `
EXAMIRROR - ONLINE TEST SERIES & LEARNING PORTAL
===================================================
Dear ${fullName},

Your 6-Digit Examirror Verification Code is:
>>>  ${otpCode}  <<<

Valid for 10 minutes only.

---------------------------------------------------
CANDIDATE REGISTRATION DETAILS:
---------------------------------------------------
Candidate Name : ${fullName}
Registered Email: ${toEmail}
Mobile Number  : ${formattedPhone}
Account Access : Student (Online Mock Tests & E-Notes)
Requested At   : ${requestTimestamp}

WHAT YOU UNLOCK:
- Full-length mock tests for SSC, Banking, Teaching, Railways & more
- Real-time All-India rank & detailed analytics
- Step-by-step question solutions and time tracking
- Curated e-notes & study materials

SECURITY WARNING:
Never share this OTP with anyone. Examirror representatives will never ask for your verification code. If you did not initiate this registration, please disregard this email.

Examirror Education & Skill Development
Online Assessment & Learning Portal
  `.trim();

  if (!transporter) {
    console.log('\n======================================================');
    console.log(`[BREVO-DEV-FALLBACK] Email OTP for: ${toEmail}`);
    console.log(`[BREVO-DEV-FALLBACK] Candidate: ${fullName} (${formattedPhone})`);
    console.log(`[BREVO-DEV-FALLBACK] OTP Code: ${otpCode}`);
    console.log('======================================================\n');
    return { success: true, mode: 'dev_mock' };
  }

  try {
    const info = await transporter.sendMail({
      from: senderEmail,
      to: toEmail,
      subject: `${otpCode} is your Examirror Verification Code | Complete Registration`,
      text: plainTextContent,
      html: htmlContent
    });

    console.log(`[Brevo SMTP] Rich OTP email sent to ${toEmail} (${fullName}). Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, mode: 'smtp' };
  } catch (error: any) {
    console.error(`[Brevo SMTP Error] Failed to send email to ${toEmail}:`, error?.message || error);
    throw new Error(`Failed to send verification email: ${error?.message || 'SMTP Error'}`);
  }
};

