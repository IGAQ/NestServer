import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class CommentCreationPayloadDto {
    @ApiProperty({ type: String, minLength: 5, maxLength: 2500 })
    @IsString()
    @IsNotEmpty()
    commentContent: string;


    constructor(partial?: Partial<CommentCreationPayloadDto>) {
        Object.assign(this, partial);
    }
}