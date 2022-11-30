import { CacheModule, Logger, MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CommentsModule } from "./comments/comments.module";
import { DatabaseAccessLayerModule } from "./database-access-layer/database-access-layer.module";
import { Neo4jModule } from "./neo4j/neo4j.module";
import { Neo4jConfig } from "./neo4j/neo4jConfig.interface";
import { Neo4jSeedService } from "./neo4j/services/neo4j.seed.service";
import { PostsModule } from "./posts/posts.module";
import { UsersModule } from "./users/users.module";
import { AppLoggerMiddleware } from "./_domain/middlewares/appLogger.middleware";
import { neo4jCredentials } from "./_domain/constants";
import { ModerationModule } from "./moderation/moderation.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { GoogleCloudRecaptchaEnterpriseModule } from './google-cloud-recaptcha-enterprise/google-cloud-recaptcha-enterprise.module';
import { PusherModule } from './pusher/pusher.module';

@Module({
    imports: [
        ThrottlerModule.forRoot({
            ttl: 69,
            limit: 42,
        }),
        Neo4jModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService): Neo4jConfig => ({
                scheme: configService.get("NEO4J_SCHEME") ?? neo4jCredentials.scheme,
                host: configService.get("NEO4J_HOST") ?? neo4jCredentials.host,
                port: configService.get("NEO4J_PORT") ?? neo4jCredentials.port,
                username: configService.get("NEO4J_USERNAME") ?? neo4jCredentials.username,
                password: configService.get("NEO4J_PASSWORD") ?? neo4jCredentials.password,
                database: configService.get("NEO4J_DATABASE") ?? neo4jCredentials.database,
            }),
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        CacheModule.register({
            isGlobal: true,
        }),
        AuthModule,
        UsersModule,
        PostsModule,
        CommentsModule,
        DatabaseAccessLayerModule,
        ModerationModule,
        GoogleCloudRecaptchaEnterpriseModule,
        PusherModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {
    private readonly _logger = new Logger(AppModule.name);

    constructor(private _neo4jSeedService: Neo4jSeedService) {}

    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(AppLoggerMiddleware).forRoutes("*");
    }

    onModuleInit() {
        // this._neo4jSeedService
        //     .seed()
        //     .then(() => this._logger.log("Neo4j database seeded ✅"))
        //     .catch(error => this._logger.error(error));
    }
}
