import { Inject, Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CommentsModule } from "./comments/comments.module";
import { Neo4jModule } from "./neo4j/neo4j.module";
import { Neo4jConfig } from "./neo4j/neo4jConfig.interface";
import { Neo4jSeedService } from "./neo4j/services/neo4j.seed.service";
import { PostsModule } from "./posts/posts.module";
import { UsersModule } from "./users/users.module";

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
        AuthModule,
        UsersModule,
        PostsModule,
        CommentsModule,
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
