import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import swaggerSetup from "./swaggerSetup";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
    }));

    await swaggerSetup(app);

    await app.listen(3000);


}
bootstrap();
