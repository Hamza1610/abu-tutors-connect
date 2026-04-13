import nodemailer from 'nodemailer';
import logger from './logger';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL/TLS connection
    auth: {
        user: process.env.SMTP_USER?.replace(/"/g, ''),
        pass: process.env.SMTP_PASS?.replace(/"/g, ''),
    },
});

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
    html?: string;
}

export const sendEmail = async (options: EmailOptions) => {
    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'ABUTutorsConnect'}" <${process.env.SMTP_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent: ${info.messageId}`);
    } catch (error: any) {
        logger.error(`Error sending email: ${error.message}`);
        
        // In local development, we show the email in the console so you can test without real SMTP
        if (process.env.NODE_ENV !== 'production') {
            const separator = '='.repeat(50);
            console.log('\n' + separator);
            console.log('📬  DEVELOPMENT MOCK EMAIL');
            console.log(separator);
            console.log(`FROM:    "${process.env.SMTP_FROM_NAME || 'ABUTutorsConnect'}" <${process.env.SMTP_USER}>`);
            console.log(`TO:      ${options.email}`);
            console.log(`SUBJECT: ${options.subject}`);
            console.log(separator);
            console.log(`MESSAGE:\n${options.message}`);
            if (options.html) {
                console.log(separator);
                console.log('HTML Content (Excerpt):');
                console.log(options.html.substring(0, 200) + '...');
            }
            console.log(separator + '\n');
        }

        if (process.env.NODE_ENV === 'production') {
            throw new Error('Email could not be sent');
        }
    }
};
