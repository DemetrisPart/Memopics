import { Global, Module } from "@nestjs/common";
import { STORAGE_SERVICE } from "@momeva/domain";
import { createStorageServiceFromEnv } from "@momeva/storage";
import type { StorageService } from "@momeva/domain";

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useFactory: (): StorageService => createStorageServiceFromEnv(),
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
