import nodemailer, { Transporter } from "nodemailer";

let transport: Transporter | null = null;

function getMailer(): Transporter {
    if (!transport) {
        transport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: process.env.SMTP_PORT === "465",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transport;
}

export async function sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
}): Promise<void> {
    await getMailer().sendMail({
        from: process.env.SMTP_FROM,
        ...options,
    });
}
