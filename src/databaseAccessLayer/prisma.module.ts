import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Module({
	providers: [
		{
			provide: "IPrismaService",
			useClass: PrismaService,
		},
	],
	exports: [
		{
			provide: "IPrismaService",
			useClass: PrismaService,
		},
	],
})
export class PrismaModule {}
