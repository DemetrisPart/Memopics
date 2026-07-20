import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { getLogger } from "@memopics/logging";
import { API_REQUEST_TIMEOUT_MS } from "@memopics/shared";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/global-exception.filter";

async function bootstrap(): Promise<void> {
  const logger = getLogger().child({ service: "api" });
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix("v1");
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(ConfigService)));
  app.enableCors({
    origin: process.env.WEB_APP_URL ?? "http://localhost:3000",
    credentials: true,
  });

  const port = Number(process.env.API_PORT ?? 3001);
  const server = await app.listen(port);
  server.setTimeout(API_REQUEST_TIMEOUT_MS);
  server.keepAliveTimeout = 5000;

  logger.info(
    { port, requestTimeoutMs: API_REQUEST_TIMEOUT_MS },
    "Memopics API listening",
  );
}

bootstrap().catch((err: unknown) => {
  getLogger().fatal({ err }, "Failed to start API");
  process.exit(1);
});
