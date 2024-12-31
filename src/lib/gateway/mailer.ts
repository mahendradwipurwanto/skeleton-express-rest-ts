import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import logger from "@/lib/helper/logger";

// Load environment variables from the .env file
dotenv.config();

// Function to send email
export const sendEmail = async (to: string, subject: string, template: string | null, params: any) => {
    try {
        // Check if all required environment variables are loaded
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error('SMTP configuration is missing in environment variables');
        }

        // Determine if the connection should use SSL/TLS
        const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
        const secure = smtpPort === 465; // Use SSL for port 465, TLS for other ports like 587

        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || '',
            port: smtpPort,
            secure, // Use SSL for port 465, TLS for 587
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        let emailBody: string;

        if (template) {
            // If template is provided, load and compile it
            const templatePath = path.join(__dirname, 'templates', template);
            const templateContent = fs.readFileSync(templatePath, 'utf-8');
            const compiledTemplate = handlebars.compile(templateContent);
            console.log("params", params)
            emailBody = compiledTemplate(params);
        } else {
            // If no template is provided, send plaintext
            emailBody = params.text || '';
        }

        // Define email options
        const mailOptions = {
            from: process.env.SMTP_USER, // Sender address
            to, // Recipient address
            subject, // Subject line
            html: emailBody, // HTML body or plaintext
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        logger.info(`[MAILER] Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error('[MAILER] Error sending email:', error);
        throw new Error('Failed to send email');
    }
};