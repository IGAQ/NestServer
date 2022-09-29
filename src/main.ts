import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import swaggerSetup from "./swaggerSetup";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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
