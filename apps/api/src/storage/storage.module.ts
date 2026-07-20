import { Global, Module } from "@nestjs/common";
import { STORAGE_SERVICE } from "@memopics/domain";
import { createStorageServiceFromEnv } from "@memopics/storage";
import type { StorageService } from "@memopics/domain";

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
