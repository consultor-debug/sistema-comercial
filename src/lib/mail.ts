import nodemailer from 'nodemailer';

interface SmtpSettings {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
}

interface MailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
    }>;
}

export async function sendEmail(settings: SmtpSettings, options: MailOptions) {
    const transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.port === 465, // true for 465, false for other ports
        auth: {
            user: settings.user,
            pass: settings.pass,
        },
    });

    const info = await transporter.sendMail({
        from: `"${settings.from}" <${settings.user}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
    });

    return info;
}
