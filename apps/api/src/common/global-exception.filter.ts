import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { getLogger } from "@memopics/logging";

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = getLogger().child({ service: "api" });

  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers["x-request-id"] as string) ?? "unknown";

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(
        typeof body === "string"
          ? { statusCode: status, message: body, requestId }
          : { ...(body as object), requestId },
      );
      return;
    }

    this.logger.error(
      {
        err: exception,
        requestId,
        method: request.method,
        path: request.originalUrl,
      },
      "Unhandled API exception",
    );

    const isProd = this.config.get("NODE_ENV") === "production";
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isProd ? "Internal server error" : "Unexpected error",
      requestId,
    });
  }
}
