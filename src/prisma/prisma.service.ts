import { INestApplication, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly _logger = new Logger(PrismaService.name);

    async onModuleInit() {
        try {
            this._logger.log("Connecting to Prisma database... ⏳");
            await this.$connect();
            this._logger.log("Connected to Prism ✅");
        } catch (error) {
            console.error(error);
        }
    }

    async enableShutdownHooks(app: INestApplication) {
        this.$on("beforeExit", async () => {
            await app.close();
        });
    }
}
