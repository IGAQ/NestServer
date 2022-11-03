import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import swaggerSetup from "./swaggerSetup";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.disable("x-powered-by");

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
        })
    );

    app.enableCors({
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
        optionsSuccessStatus: 200,
    });

    await swaggerSetup(app);

    await app.listen(process.env.PORT || 8080);
}
bootstrap();
