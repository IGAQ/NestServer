import { CommentsController } from "./controllers/comments.controller";
import { _$ } from "../_domain/injectableTokens";
import { CommentsService } from "./services/comments.service";
import { CommentsRepository } from "./services/commentRepository/comments.repository";
import { DatabaseAccessLayerModule } from "../database-access-layer/database-access-layer.module";
import { forwardRef, Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";

@Module({
    controllers: [CommentsController],
    imports: [forwardRef(() => DatabaseAccessLayerModule), HttpModule],
    providers: [
        {
            provide: _$.ICommentsService,
            useClass: CommentsService,
        },
        {
            provide: _$.ICommentsRepository,
            useClass: CommentsRepository,
        },
    ],
    exports: [
        {
            provide: _$.ICommentsService,
            useClass: CommentsService,
        },
        {
            provide: _$.ICommentsRepository,
            useClass: CommentsRepository,
        },
    ],
})
export class CommentsModule {}
