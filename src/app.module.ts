import { Inject, Logger, Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PostsModule } from "./posts/posts.module";
import { Neo4jModule } from "./neo4j/neo4j.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Neo4jConfig } from "./neo4j/neo4jConfig.interface";
import { Neo4jSeedService } from "./neo4j/services/neo4j.seed.service";

@Module({
    imports: [
        Neo4jModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService): Neo4jConfig => ({
                scheme: configService.get("NEO4J_SCHEME"),
                host: configService.get("NEO4J_HOST"),
                port: configService.get("NEO4J_PORT"),
                username: configService.get("NEO4J_USERNAME"),
                password: configService.get("NEO4J_PASSWORD"),
                database: configService.get("NEO4J_DATABASE"),
            }),
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        PostsModule,
    ],
})
export class AppModule {
    private readonly _logger = new Logger(AppModule.name);

    constructor(private _neo4jSeedService: Neo4jSeedService) {}

    onModuleInit() {
        this._neo4jSeedService
            .seed()
            .then(() => this._logger.log("Neo4j database seeded ✅"))
            .catch(error => this._logger.error(error));
    }
}
