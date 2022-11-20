import { DynamicModule, Module, Provider } from "@nestjs/common";
import { Neo4jService } from "./services/neo4j.service";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "./neo4j.constants";
import { createDriver } from "./neo4j.utils";
import { Neo4jConfig } from "./neo4jConfig.interface";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Neo4jSeedService } from "./services/neo4j.seed.service";

@Module({
    providers: [Neo4jService, Neo4jSeedService],
})
export class Neo4jModule {
    public static forRoot(config: any): DynamicModule {
        return {
            module: Neo4jModule,
            global: true,
            imports: [ConfigModule],

            providers: [
                {
                    provide: NEO4J_OPTIONS,
                    ...config,
                },
                {
                    provide: NEO4J_DRIVER,
                    inject: [NEO4J_OPTIONS],
                    useFactory: async (config: Neo4jConfig) => createDriver(config),
                },
                Neo4jService,
            ],
            exports: [Neo4jService, Neo4jSeedService],
        };
    }

    public static forRootAsync(configProvider: any): DynamicModule {
        return {
            module: Neo4jModule,
            global: true,
            imports: [ConfigModule],

            providers: [
                {
                    provide: NEO4J_OPTIONS,
                    ...configProvider,
                } as Provider<any>,
                {
                    provide: NEO4J_DRIVER,
                    inject: [NEO4J_OPTIONS],
                    useFactory: async (config: Neo4jConfig) => createDriver(config),
                },
                Neo4jService,
            ],
            exports: [Neo4jService, Neo4jSeedService],
        };
    }

    public static fromEnv(): DynamicModule {
        return {
            module: Neo4jModule,
            global: true,
            imports: [ConfigModule],
            providers: [
                {
                    provide: NEO4J_OPTIONS,
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService): Neo4jConfig => ({
                        scheme: configService.get("NEO4J_SCHEME"),
                        host: configService.get("NEO4J_HOST"),
                        port: configService.get("NEO4J_PORT"),
                        username: configService.get("NEO4J_USERNAME"),
                        password: configService.get("NEO4J_PASSWORD"),
                        database: configService.get("NEO4J_DATABASE"),
                    }),
                } as Provider<any>,
                {
                    provide: NEO4J_DRIVER,
                    inject: [NEO4J_OPTIONS],
                    useFactory: async (config: Neo4jConfig) => createDriver(config),
                },
                Neo4jService,
            ],
            exports: [Neo4jService],
        };
    }
}
