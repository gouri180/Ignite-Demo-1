const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;

  if (!user || user === 'your-email@gmail.com' || !pass || pass === 'your-app-password') {
    return null;
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
      family: 4, // force IPv4 - some hosts (like Render) can't route to Gmail's IPv6 address
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 20000
    });
  }

  // Explicit Gmail SMTP settings tend to be more reliable on cloud hosts
  // than nodemailer's 'service: gmail' shorthand.
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass },
    family: 4, // force IPv4 - some hosts (like Render) can't route to Gmail's IPv6 address
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000
  });
};

const buildEmailTemplate = (user) => {
  const leaderName = user.name || user.leaderName || 'Innovator';
  const regId = user.teamId || (user.id ? `IGN20-${user.id.slice(-6)}` : `IGN20-${Date.now().toString().slice(-6)}`);
  const dateStr = user.registeredAt ? new Date(user.registeredAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : new Date().toLocaleDateString();

  let teamMembersHtml = '';
  if (user.teamMembers) {
    try {
      const members = JSON.parse(user.teamMembers);
      if (Array.isArray(members) && members.length > 0) {
        teamMembersHtml = members.map(m => {
          let str = m.name || '';
          if (m.email) str += ` (${m.email})`;
          if (m.phone) str += ` - ${m.phone}`;
          return str ? `<li>${str}</li>` : '';
        }).join('');
      }
    } catch(e) {}
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to IGNITE 2.0</title>
  <style>
    @media only screen and (max-width: 600px) {
      .responsive-td {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #030706; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <!-- Main Container -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030706; padding: 40px 10px;">
    <tr>
      <td align="center">
        
        <!-- Outer Card Wrapper -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #080f09; border-radius: 20px; overflow: hidden; border: 1px solid rgba(132, 227, 37, 0.15); box-shadow: 0 0 40px rgba(132, 227, 37, 0.1);">
          
          <!-- Top Neon Accent Header -->
          <tr>
            <td style="height: 6px; background-color: #84E325; box-shadow: 0 0 10px rgba(132, 227, 37, 0.5);"></td>
          </tr>

          <!-- Branding Banner -->
          <tr>
            <td align="center" style="padding: 40px 30px 20px 30px;">
              <table border="0" cellspacing="0" cellpadding="0">

                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 34px; font-weight: 900; letter-spacing: -0.5px;">
                      IGNITE <span style="color: #84E325;">2.0</span>
                    </h1>
                    <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                      Think. Build. Ignite the future.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 0 40px 25px 40px; text-align: center;">
              <h2 style="margin: 0 0 10px 0; color: #f8fafc; font-size: 22px; font-weight: 700;">
                Welcome to the Future, ${leaderName}!
              </h2>
              <p style="margin: 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                Your registration for <strong style="color: #ffffff;">IGNITE 2.0</strong> has been successfully confirmed. Get ready to build, innovate, and showcase your ideas among India's top tech talents!
              </p>
            </td>
          </tr>

          <!-- Team Details -->
          <tr>
            <td style="padding: 0 40px 25px 40px; text-align: left;">
              <h3 style="margin: 0 0 10px 0; color: #84E325; font-size: 16px; font-weight: 600;">Team Details</h3>
              <p style="margin: 0 0 5px 0; color: #94a3b8; font-size: 14px;"><strong>Team Name:</strong> ${user.teamName || 'N/A'}</p>
              <p style="margin: 0 0 5px 0; color: #94a3b8; font-size: 14px;"><strong>Leader:</strong> ${leaderName} (${user.email})</p>
              ${teamMembersHtml ? `<p style="margin: 10px 0 5px 0; color: #94a3b8; font-size: 14px;"><strong>Members:</strong></p>
              <ul style="margin: 0; color: #94a3b8; font-size: 14px; padding-left: 20px; line-height: 1.6;">
                ${teamMembersHtml}
              </ul>` : ''}
            </td>
          </tr>

          <!-- Digital Pass Ticket Card -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d180f; border-radius: 16px; border: 1px solid rgba(132, 227, 37, 0.1); padding: 24px;">
                
                <tr>
                  <td style="padding-bottom: 18px; border-bottom: 1px dashed rgba(255, 255, 255, 0.12);">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">REGISTRATION PASS ID</span>
                          <div style="color: #84E325; font-size: 20px; font-weight: 800; font-family: monospace; margin-top: 2px;">${regId}</div>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; padding: 4px 12px; background: rgba(132, 227, 37, 0.15); border: 1px solid rgba(132, 227, 37, 0.4); color: #84E325; border-radius: 20px; font-size: 12px; font-weight: 700;">
                            ✓ CONFIRMED
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Details Grid -->
                <tr>
                  <td style="padding-top: 18px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" class="responsive-td" style="padding-bottom: 14px; vertical-align: top;">
                          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Team Leader</div>
                          <div style="color: #f1f5f9; font-size: 14px; font-weight: 600; margin-top: 2px;">${leaderName}</div>
                        </td>
                        <td width="50%" class="responsive-td" style="padding-bottom: 14px; vertical-align: top;">
                          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Team Name</div>
                          <div style="color: #f1f5f9; font-size: 14px; font-weight: 600; margin-top: 2px;">${user.teamName || 'Solo'}</div>
                        </td>
                      </tr>

                      <tr>
                        <td width="50%" class="responsive-td" style="padding-bottom: 14px; vertical-align: top;">
                          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Email Address</div>
                          <div style="color: #84E325; font-size: 13px; font-weight: 500; margin-top: 2px; word-break: break-all;">${user.email}</div>
                        </td>
                        <td width="50%" class="responsive-td" style="padding-bottom: 14px; vertical-align: top;">
                          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Contact Phone</div>
                          <div style="color: #f1f5f9; font-size: 14px; font-weight: 600; margin-top: 2px;">${user.phone || 'N/A'}</div>
                        </td>
                      </tr>

                      <tr>
                        <td width="50%" class="responsive-td" style="padding-bottom: 14px; vertical-align: top;">
                          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Institution</div>
                          <div style="color: #f1f5f9; font-size: 14px; font-weight: 600; margin-top: 2px;">${user.institutionName || user.college || 'N/A'}</div>
                        </td>
                        <td width="50%" class="responsive-td" style="padding-bottom: 14px; vertical-align: top;">
                          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Registered Date</div>
                          <div style="color: #f1f5f9; font-size: 14px; font-weight: 600; margin-top: 2px;">${dateStr}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Roadmap Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="color: #cbd5e1; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; text-align: center;">
                What Happens Next?
              </div>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); padding: 16px;">
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                    <strong style="color: #84E325;">1. Join Community Channels:</strong> You must join our official <a href="https://chat.whatsapp.com/DeGExsR69SzEuvQ9HJYSez?s=sw&p=i&mlu=4" style="color: #84E325; text-decoration: underline;">WhatsApp Group</a> and <a href="https://chat.whatsapp.com/E8eU0K7VayHG47RjwZvWbG" style="color: #84E325; text-decoration: underline;">Community</a> for updates.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                    <strong style="color: #84E325;">2. Build & Submit:</strong> Start working on your solution. Submit your idea using the link below:<br><br>
                    <a href="https://docs.google.com/forms/d/e/1FAIpQLSfp6q_cLtD1Q6kIQSYP7CaaCU4ZLVhLr54PU59V9rS-aYsA5g/viewform?usp=publish-editor" style="display: inline-block; padding: 10px 20px; background-color: #84E325; color: #000000; text-decoration: none; border-radius: 8px; font-weight: bold;">Submit Idea Form</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                    <strong style="color: #84E325;">3. Ideathon Finale:</strong> Shortlisted teams will proceed to the onsite finale!
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Follow for More Updates -->
          <tr>
            <td align="left" style="padding: 0 40px 30px 40px;">
              <h3 style="margin: 0 0 10px 0; color: #84E325; font-size: 16px; font-weight: 600;">Follow for More Updates</h3>
              <ul style="margin: 0; color: #94a3b8; font-size: 14px; padding-left: 20px; line-height: 1.8;">
                <li><strong>Ignite 2.0 WhatsApp Group:</strong> <a href="https://chat.whatsapp.com/DeGExsR69SzEuvQ9HJYSez?s=sw&p=i&mlu=4" style="color: #84E325; text-decoration: none;">Join Here</a></li>
                <li><strong>iHub WhatsApp Community:</strong> <a href="https://chat.whatsapp.com/E8eU0K7VayHG47RjwZvWbG" style="color: #84E325; text-decoration: none;">Join Here</a></li>
                <li><strong>Instagram:</strong> <a href="https://instagram.com/ihub_school_of_learning" style="color: #84E325; text-decoration: none;">@ihub_school_of_learning</a></li>
                <li><strong>Website:</strong> <a href="https://ihubschool.com" style="color: #84E325; text-decoration: none;">ihubschool.com</a></li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #060c07; padding: 25px 30px; border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="margin: 0 0 5px 0; color: #cbd5e1; font-size: 13px; font-weight: bold;">
                I Hub Research & Robotics Pvt Ltd
              </p>
              <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px;">
                Have questions? Email: <a href="mailto:teamihsl31@gmail.com" style="color: #84E325; text-decoration: none;">teamihsl31@gmail.com</a> | Phone: +91 7902899111
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                © 2026 IGNITE 2.0 | IHSL & iHub Innovation Center. All rights reserved.
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
};

const sendWelcomeEmail = async (user) => {
  const htmlContent = buildEmailTemplate(user);
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[EMAIL SERVICE DEV MODE] Email notice for ${user.email} (${user.name}): SMTP credentials (EMAIL_USER/EMAIL_PASS) not set in backend/.env. Rendered template successfully.`);
    return { devMode: true, message: 'Email template generated successfully (dev mode log)' };
  }

  let toEmails = [user.email];

  const mailOptions = {
    from: `"IGNITE 2.0 Team" <${process.env.EMAIL_USER}>`,
    to: toEmails.join(','),
    subject: 'Welcome to IGNITE 2.0 - Registration Confirmed!',
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL SERVICE] Email sent successfully to ' + user.email + ': ' + info.response);
    return info;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending email to ' + user.email + ':', error);
    // Don't re-throw so user registration process remains smooth
    return { error: error.message };
  }
};

const buildPaymentConfirmedTemplate = (user) => {
  const leaderName = user.name || user.leaderName || 'Innovator';
  const regId = user.teamId || (user.id ? `IGN20-${user.id.slice(-6)}` : `IGN20-${Date.now().toString().slice(-6)}`);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed - IGNITE 2.0</title>
  <style>
    @media only screen and (max-width: 600px) {
      .responsive-td {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #030706; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030706; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #080f09; border-radius: 20px; overflow: hidden; border: 1px solid rgba(132, 227, 37, 0.15); box-shadow: 0 0 40px rgba(132, 227, 37, 0.1);">
          <tr>
            <td style="height: 6px; background-color: #84E325;"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 40px 30px 20px 30px;">
              <div style="display: inline-block; padding: 6px 16px; border-radius: 50px; background: rgba(132, 227, 37, 0.12); border: 1px solid rgba(132, 227, 37, 0.3); color: #84E325; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">
                Payment Confirmed
              </div>
              <h1 style="margin: 6px 0 0 0; color: #ffffff; font-size: 30px; font-weight: 900;">
                IGNITE <span style="color: #84E325;">2.0</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 25px 40px; text-align: center;">
              <h2 style="margin: 0 0 10px 0; color: #f8fafc; font-size: 22px; font-weight: 700;">
                You're all set, ${leaderName}!
              </h2>
              <p style="margin: 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                We've received your registration fee for <strong style="color: #ffffff;">IGNITE 2.0</strong>. Your spot is fully confirmed.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d180f; border-radius: 16px; border: 1px solid rgba(132, 227, 37, 0.1); padding: 24px;">
                <tr>
                  <td>
                    <span style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">REGISTRATION PASS ID</span>
                    <div style="color: #84E325; font-size: 20px; font-weight: 800; font-family: monospace; margin-top: 2px;">${regId}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 18px;">
                    <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Payment ID</div>
                    <div style="color: #f1f5f9; font-size: 13px; font-weight: 500; margin-top: 2px; word-break: break-all;">${user.razorpayPaymentId || 'N/A'}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #060c07; padding: 25px 30px; border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="margin: 0 0 5px 0; color: #cbd5e1; font-size: 13px; font-weight: bold;">
                I Hub Research & Robotics Pvt Ltd
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Questions? Email: <a href="mailto:teamihsl31@gmail.com" style="color: #84E325; text-decoration: none;">teamihsl31@gmail.com</a>
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
};

const sendPaymentConfirmationEmail = async (user) => {
  const htmlContent = buildPaymentConfirmedTemplate(user);
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[EMAIL SERVICE DEV MODE] Payment confirmation for ${user.email}: SMTP not configured, template rendered only.`);
    return { devMode: true };
  }

  const mailOptions = {
    from: `"IGNITE 2.0 Team" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Payment Confirmed - IGNITE 2.0 Registration Complete!',
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL SERVICE] Payment confirmation sent to ' + user.email + ': ' + info.response);
    return info;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending payment confirmation to ' + user.email + ':', error);
    return { error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  buildEmailTemplate,
  sendPaymentConfirmationEmail,
  buildPaymentConfirmedTemplate
};
