import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import QRCode from "qrcode";
import { buildPublicEventUrl } from "@memopics/domain";

@Injectable()
export class QrService {
  constructor(private readonly config: ConfigService) {}

  getEventPublicUrl(slug: string): string {
    const baseUrl = this.config.get<string>(
      "PUBLIC_EVENT_BASE_URL",
      this.config.get<string>("WEB_APP_URL", "http://localhost:3000"),
    );
    return buildPublicEventUrl(baseUrl, slug);
  }

  async generatePngBuffer(url: string): Promise<Buffer> {
    return QRCode.toBuffer(url, {
      type: "png",
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    });
  }

  async generatePngBase64(url: string): Promise<string> {
    const buffer = await this.generatePngBuffer(url);
    return buffer.toString("base64");
  }
}
