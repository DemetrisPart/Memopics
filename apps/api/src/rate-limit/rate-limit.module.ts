import { Global, Module } from "@nestjs/common";
import { GlobalRateLimitMiddleware } from "./global-rate-limit.middleware";
import { RateLimitService } from "./rate-limit.service";

@Global()
@Module({
  providers: [RateLimitService, GlobalRateLimitMiddleware],
  exports: [RateLimitService, GlobalRateLimitMiddleware],
})
export class RateLimitModule {}
