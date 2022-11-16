import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CommentCreationPayloadDto {
    @ApiProperty({ type: String, minLength: 5, maxLength: 2500 })
    @IsString()
    @IsNotEmpty()
    commentContent: string;

    @ApiProperty({ type: String, format: "uuid" })
    parentId: string;

    constructor(partial?: Partial<CommentCreationPayloadDto>) {
        Object.assign(this, partial);
    }
}
