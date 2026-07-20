import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { generateRequestId, logRequest, logSlowRequest } from "@memopics/logging";
import { SLOW_REQUEST_THRESHOLD_MS } from "@memopics/shared";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers["x-request-id"] as string) ?? generateRequestId();
    req.headers["x-request-id"] = requestId;
    res.setHeader("x-request-id", requestId);

    const start = Date.now();

    res.on("finish", () => {
      const durationMs = Date.now() - start;
      logRequest({
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        requestId,
      });

      if (durationMs >= SLOW_REQUEST_THRESHOLD_MS) {
        logSlowRequest({
          method: req.method,
          path: req.originalUrl,
          durationMs,
          requestId,
        });
      }
    });

    next();
  }
}
