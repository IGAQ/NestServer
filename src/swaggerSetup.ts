import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function swaggerSetup(app: any) {
    const config = new DocumentBuilder()
        .setTitle("Nest Server REST API")
        .setDescription("IGAQ REST API Documentation")
        .setVersion("1.0")
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("/", app, document);
}
export default swaggerSetup;
