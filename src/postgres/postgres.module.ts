// src/postgres/postgres.module.ts
import { DynamicModule, Module } from "@nestjs/common";
import { DrizzleService } from "./postgres.service";
import { PostgresOptions } from "./types";

@Module({})
export class DrizzleModule {
  static forRoot<TSchema extends Record<string, unknown> = Record<string, unknown>>(
    options: PostgresOptions
  ): DynamicModule {
    return this.createModule<TSchema>({
      provide: DrizzleService,
      useFactory: () => new DrizzleService<TSchema>(options),
    });
  }

  private static createModule<TSchema extends Record<string, unknown>>(
    provider: {
      provide: typeof DrizzleService;
      useFactory: () => Promise<DrizzleService<TSchema>> | DrizzleService<TSchema>;
    }
  ): DynamicModule {
    return {
      module: DrizzleModule,
      providers: [provider],
      exports: [DrizzleService],
      global: true,
    };
  }
}