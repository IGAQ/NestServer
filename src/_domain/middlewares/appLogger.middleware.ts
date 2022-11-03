import { Injectable, NestMiddleware, Logger } from "@nestjs/common";

import { Request, Response, NextFunction } from "express";

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
    private logger = new Logger("HTTP");

    use(request: Request, response: Response, next: NextFunction): void {
        const { ip, method, path: url } = request;
        const userAgent = request.get("user-agent") || "";

        response.on("close", () => {
            const { statusCode } = response;
            const contentLength = response.get("content-length");

            this.logger.log(
                `${method} ${request.originalUrl} ${statusCode} content-length: ${
                    contentLength ?? "[contentLength missing]"
                } - ${userAgent} ${ip}`
            );
        });

        next();
    }
}
