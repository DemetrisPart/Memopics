import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { getClientIp } from "../common/client-ip.util";
import { RateLimitService } from "./rate-limit.service";

@Injectable()
export class GlobalRateLimitMiddleware implements NestMiddleware {
  constructor(private readonly rateLimit: RateLimitService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (req.path.startsWith("/v1/health")) {
      next();
      return;
    }

    try {
      await this.rateLimit.assertGlobalApiLimit(getClientIp(req));
      next();
    } catch (err) {
      next(err);
    }
  }
}
