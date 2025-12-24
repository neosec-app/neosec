const brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
let apiInstance = new brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY || '';

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
const FROM_NAME = process.env.FROM_NAME || 'NeoSec Security';

/**
 * Send email using Brevo
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!process.env.BREVO_API_KEY) {
            console.warn('Brevo not configured. Skipping email send.');
            return { success: false, message: 'Email service not configured' };
        }

        let sendSmtpEmail = new brevo.SendSmtpEmail();

        sendSmtpEmail.sender = {
            email: FROM_EMAIL,
            name: FROM_NAME
        };

        sendSmtpEmail.to = Array.isArray(to)
            ? to.map(email => ({ email }))
            : [{ email: to }];

        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html || `<html><body><pre>${text}</pre></body></html>`;
        sendSmtpEmail.textContent = text;

        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', result.messageId);

        return {
            success: true,
            messageId: result.messageId
        };
    } catch (error) {
        console.error('Email send error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email'
        };
    }
};

/**
 * Send VPN down notification
 */
const sendVpnDownNotification = async (user, vpnConfig) => {
    // Handle both string and object formats
    let vpnData = {};
    if (typeof vpnConfig === 'string') {
        // Parse string format
        const nameMatch = vpnConfig.match(/Site: ([^.]+)/);
        vpnData = {
            name: nameMatch ? nameMatch[1].trim() : 'Unknown VPN',
            protocol: 'WireGuard'
        };
    } else {
        vpnData = vpnConfig || {};
    }

    const subject = '🚨 VPN Connection Down - NeoSec Alert';
    const text = `
Hello ${user.email},

Your VPN connection "${vpnData.name}" (${vpnData.protocol || 'WireGuard'}) has gone down.

Time: ${new Date().toLocaleString()}
VPN Configuration: ${vpnData.name}
Protocol: ${vpnData.protocol || 'WireGuard'}

Please check your VPN configuration and try reconnecting.

Best regards,
NeoSec Security Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #e04848 0%, #c93636 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .content {
            padding: 30px 20px;
        }
        .footer {
            background: #f8f9fa;
            color: #666;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .info-box {
            background: #f8f9fa;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #e04848;
            border-radius: 4px;
        }
        h1 {
            margin: 10px 0 0 0;
            font-size: 24px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">🚨</div>
            <h1>VPN Connection Down</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${user.email}</strong>,</p>
            <p>Your VPN connection has gone down and requires your attention.</p>

            <div class="info-box">
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>VPN Configuration:</strong> ${vpnData.name}</p>
                <p><strong>Protocol:</strong> ${vpnData.protocol || 'WireGuard'}</p>
            </div>

            <p>Please check your VPN configuration and try reconnecting through your NeoSec dashboard.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>NeoSec Security Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from NeoSec.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;

    return await sendEmail({ to: user.email, subject, text, html });
};

/**
 * Send certificate expiring notification
 */
const sendCertificateWarning = async (user, certificateDetails) => {
    // Handle both string and object formats
    let certData = {};
    if (typeof certificateDetails === 'string') {
        // Parse string format like "Certificate expiration warning. Certificate: name. Expires: date"
        const nameMatch = certificateDetails.match(/Certificate: ([^.]+)/);
        const expiresMatch = certificateDetails.match(/Expires: ([^}]+)/);
        certData = {
            name: nameMatch ? nameMatch[1].trim() : 'Unknown Certificate',
            expiryDate: expiresMatch ? expiresMatch[1].trim() : null,
            daysRemaining: 'Unknown'
        };
    } else {
        certData = certificateDetails || {};
    }

    const subject = '⚠️ Certificate Expiring Soon - NeoSec Warning';
    const text = `
Hello ${user.email},

A certificate is expiring soon and requires your attention.

Time: ${new Date().toLocaleString()}
Certificate: ${certData.name || 'Unknown Certificate'}
Expires: ${certData.expiryDate ? new Date(certData.expiryDate).toLocaleString() : 'Unknown'}
Days Remaining: ${certData.daysRemaining || 'Unknown'}

Please renew the certificate to avoid service interruptions.

Best regards,
NeoSec Security Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #f0a500 0%, #d89000 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .content {
            padding: 30px 20px;
        }
        .footer {
            background: #f8f9fa;
            color: #666;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .warning-box {
            background: #fff8e1;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #f0a500;
            border-radius: 4px;
        }
        h1 {
            margin: 10px 0 0 0;
            font-size: 24px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">⚠️</div>
            <h1>Certificate Expiring Soon</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${user.email}</strong>,</p>
            <p>A certificate is expiring soon and requires your attention to avoid service interruptions.</p>

            <div class="warning-box">
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Certificate:</strong> ${certData.name || 'Unknown Certificate'}</p>
                <p><strong>Expires:</strong> ${certData.expiryDate ? new Date(certData.expiryDate).toLocaleString() : 'Unknown'}</p>
                <p><strong>Days Remaining:</strong> ${certData.daysRemaining || 'Unknown'}</p>
            </div>

            <p>Please renew the certificate through your NeoSec dashboard to ensure continued secure operation.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>NeoSec Security Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from NeoSec.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;

    return await sendEmail({ to: user.email, subject, text, html });
};

/**
 * Send firewall error notification
 */
const sendFirewallError = async (user, firewallDetails) => {
    // Handle both string and object formats
    let fwData = {};
    if (typeof firewallDetails === 'string') {
        fwData = {
            error: firewallDetails,
            rule: 'N/A',
            details: 'No additional details'
        };
    } else {
        fwData = firewallDetails || {};
    }

    const subject = '🚫 Firewall Error - NeoSec Alert';
    const text = `
Hello ${user.email},

A firewall error has been detected and requires your attention.

Time: ${new Date().toLocaleString()}
Error: ${fwData.error || 'Firewall Error'}
Rule: ${fwData.rule || 'N/A'}
Details: ${fwData.details || 'No additional details'}

Please check your firewall configuration and resolve the issue.

Best regards,
NeoSec Security Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #e04848 0%, #c93636 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .content {
            padding: 30px 20px;
        }
        .footer {
            background: #f8f9fa;
            color: #666;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .error-box {
            background: #ffebee;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #e04848;
            border-radius: 4px;
        }
        h1 {
            margin: 10px 0 0 0;
            font-size: 24px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">🚫</div>
            <h1>Firewall Error</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${user.email}</strong>,</p>
            <p>A firewall error has been detected and requires your attention.</p>

            <div class="error-box">
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Error:</strong> ${fwData.error || 'Firewall Error'}</p>
                <p><strong>Rule:</strong> ${fwData.rule || 'N/A'}</p>
                <p><strong>Details:</strong> ${fwData.details || 'No additional details'}</p>
            </div>

            <p>Please check your firewall configuration and resolve the issue through your NeoSec dashboard.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>NeoSec Security Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from NeoSec.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;

    return await sendEmail({ to: user.email, subject, text, html });
};

/**
 * Send threat detected notification
 */
const sendThreatDetectedNotification = async (user, threat) => {
    const severityColor = {
        'critical': '#d4183d',
        'high': '#f0a500',
        'medium': '#36a2eb',
        'low': '#4caf50'
    };

    const color = severityColor[threat.severity?.toLowerCase()] || '#f0a500';

    const subject = '⚠️ Security Threat Detected - NeoSec Alert';
    const text = `
Hello ${user.email},

A security threat has been detected and blocked by NeoSec.

Time: ${new Date().toLocaleString()}
Threat Type: ${threat.threatType || 'Unknown'}
Severity: ${threat.severity || 'Unknown'}
IP Address: ${threat.ipAddress || 'N/A'}
Details: ${threat.details || 'No additional details'}

The threat has been automatically blocked to protect your system.

Best regards,
NeoSec Security Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .content {
            padding: 30px 20px;
        }
        .footer {
            background: #f8f9fa;
            color: #666;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .info-box {
            background: #f8f9fa;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid ${color};
            border-radius: 4px;
        }
        .severity-badge {
            display: inline-block;
            padding: 4px 12px;
            background: ${color};
            color: white;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        h1 {
            margin: 10px 0 0 0;
            font-size: 24px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">⚠️</div>
            <h1>Security Threat Detected</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${user.email}</strong>,</p>
            <p>A security threat has been detected and automatically blocked by NeoSec.</p>

            <div class="info-box">
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Threat Type:</strong> ${threat.threatType || 'Unknown'}</p>
                <p><strong>Severity:</strong> <span class="severity-badge">${threat.severity || 'Unknown'}</span></p>
                <p><strong>IP Address:</strong> ${threat.ipAddress || 'N/A'}</p>
                <p><strong>Details:</strong> ${threat.details || 'No additional details'}</p>
            </div>

            <p>The threat has been automatically blocked to protect your system. No action is required from your side.</p>
            <p>You can view more details in your NeoSec dashboard.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>NeoSec Security Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from NeoSec.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;

    return await sendEmail({ to: user.email, subject, text, html });
};

/**
 * Send critical system alert
 */
const sendCriticalAlertNotification = async (user, alertDetails) => {
    const subject = '🔴 Critical System Alert - NeoSec';
    const text = `
Hello ${user.email},

A critical system alert requires your immediate attention.

Time: ${new Date().toLocaleString()}
Alert: ${alertDetails.title || 'Critical System Alert'}
Message: ${alertDetails.message || 'No details provided'}

Please check your NeoSec dashboard immediately.

Best regards,
NeoSec Security Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #d4183d 0%, #b01030 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .content {
            padding: 30px 20px;
        }
        .footer {
            background: #f8f9fa;
            color: #666;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .info-box {
            background: #fff5f5;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #d4183d;
            border-radius: 4px;
        }
        h1 {
            margin: 10px 0 0 0;
            font-size: 24px;
            font-weight: 600;
        }
        .urgent {
            background: #d4183d;
            color: white;
            padding: 12px;
            border-radius: 4px;
            margin: 20px 0;
            text-align: center;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">🔴</div>
            <h1>Critical System Alert</h1>
        </div>
        <div class="content">
            <div class="urgent">⚠️ IMMEDIATE ATTENTION REQUIRED</div>

            <p>Hello <strong>${user.email}</strong>,</p>
            <p>A critical system alert requires your immediate attention.</p>

            <div class="info-box">
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Alert:</strong> ${alertDetails.title || 'Critical System Alert'}</p>
                <p><strong>Message:</strong> ${alertDetails.message || 'No details provided'}</p>
            </div>

            <p><strong style="color: #d4183d;">Please check your NeoSec dashboard immediately for more information.</strong></p>

            <p style="margin-top: 30px;">Best regards,<br><strong>NeoSec Security Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from NeoSec.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;

    return await sendEmail({ to: user.email, subject, text, html });
};

/**
 * Send log export ready notification
 */
const sendLogExportReady = async (user, exportDetails) => {
    // Handle both string and object formats
    let exportData = {};
    if (typeof exportDetails === 'string') {
        exportData = {
            name: 'Log Export',
            size: 'Unknown',
            format: 'Unknown'
        };
    } else {
        exportData = exportDetails || {};
    }

    const subject = '📄 Log Export Ready - NeoSec';
    const text = `
Hello ${user.email},

Your log export is now ready for download.

Time: ${new Date().toLocaleString()}
Export Name: ${exportData.name || 'Log Export'}
File Size: ${exportData.size || 'Unknown'}
Format: ${exportData.format || 'Unknown'}

You can download the export from your NeoSec dashboard.

Best regards,
NeoSec Security Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #4caf50 0%, #3d8b40 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .content {
            padding: 30px 20px;
        }
        .footer {
            background: #f8f9fa;
            color: #666;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .info-box {
            background: #f1f8e9;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #4caf50;
            border-radius: 4px;
        }
        h1 {
            margin: 10px 0 0 0;
            font-size: 24px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">📄</div>
            <h1>Log Export Ready</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${user.email}</strong>,</p>
            <p>Great news! Your log export has been completed and is ready for download.</p>

            <div class="info-box">
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Export Name:</strong> ${exportData.name || 'Log Export'}</p>
                <p><strong>File Size:</strong> ${exportData.size || 'Unknown'}</p>
                <p><strong>Format:</strong> ${exportData.format || 'Unknown'}</p>
            </div>

            <p>You can now download the export file from your NeoSec dashboard.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>NeoSec Security Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from NeoSec.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;

    return await sendEmail({ to: user.email, subject, text, html });
};

/**
 * Send generic notification
 */
const sendGenericNotification = async (user, notificationDetails) => {
    const subject = `📢 ${notificationDetails.title || 'NeoSec Notification'}`;
    const text = `
Hello ${user.email},

${notificationDetails.message || 'You have a new notification from NeoSec.'}

Time: ${new Date().toLocaleString()}
Event Type: ${notificationDetails.eventType || 'General'}

Please check your NeoSec dashboard for more details.

Best regards,
NeoSec Security Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .content {
            padding: 30px 20px;
        }
        .footer {
            background: #f8f9fa;
            color: #666;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .info-box {
            background: #f3f9ff;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #2196f3;
            border-radius: 4px;
        }
        h1 {
            margin: 10px 0 0 0;
            font-size: 24px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">📢</div>
            <h1>${notificationDetails.title || 'NeoSec Notification'}</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${user.email}</strong>,</p>
            <p>${notificationDetails.message || 'You have a new notification from NeoSec.'}</p>

            <div class="info-box">
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Event Type:</strong> ${notificationDetails.eventType || 'General'}</p>
            </div>

            <p>Please check your NeoSec dashboard for more details.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>NeoSec Security Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from NeoSec.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;

    return await sendEmail({ to: user.email, subject, text, html });
};

module.exports = {
    sendEmail,
    sendVpnDownNotification,
    sendThreatDetectedNotification,
    sendCriticalAlertNotification,
    sendCertificateWarning,
    sendFirewallError,
    sendLogExportReady,
    sendGenericNotification
};