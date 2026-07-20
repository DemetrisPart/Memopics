import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const host = this.config.get<string>("SMTP_HOST", "localhost");
      const port = this.config.get<number>("SMTP_PORT", 1025);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
      });
    }
    return this.transporter;
  }

  async sendMagicLink(email: string, verifyUrl: string): Promise<void> {
    const from = this.config.get<string>(
      "SMTP_FROM",
      "Memopics <noreply@memopics.com>",
    );
    try {
      await this.getTransporter().sendMail({
        from,
        to: email,
        subject: "Sign in to Memopics",
        text: `Sign in to Memopics:\n\n${verifyUrl}\n\nThis link expires in ${this.config.get("MAGIC_LINK_TTL_MINUTES", 15)} minutes.`,
        html: `<p>Sign in to Memopics:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to send magic link email",
        { cause: error },
      );
    }
  }
}
