import { PrismaClient as PrismaClientDevelopment } from "./prismaClients/development";
import { PrismaClient as PrismaClientProduction } from "./prismaClients/production";

let prismaClient;

const isDevelopment = process.env.IS_DEVELOPMENT ?? true;
if (isDevelopment) {
    prismaClient = new PrismaClientDevelopment();
} else {
    prismaClient = new PrismaClientProduction({
        log: ["query", "info", "warn", "error"],
    });
}

export default prismaClient;
