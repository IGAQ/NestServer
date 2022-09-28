import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import swaggerSetup from "./swaggerSetup";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    await swaggerSetup(app);

    await app.listen(3000);
}
bootstrap();
