import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as fs from "fs";
import * as path from "path";

const styles = fs.readFileSync(path.join(__dirname, "../src/swaggerDark.css"), "utf8");

async function swaggerSetup(app: any) {
    const config = new DocumentBuilder()
        .setTitle("Nest Server REST API")
        .setDescription("IGAQ REST API Documentation")
        .setVersion("1.0")
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("/", app, document, {
        customCss: `${styles}`
    });
}
export default swaggerSetup;
