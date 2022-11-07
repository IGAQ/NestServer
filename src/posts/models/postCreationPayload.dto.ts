import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class PostCreationPayloadDto {
    @ApiProperty({ type: String, minLength: 5, maxLength: 200 })
    @IsString()
    @IsNotEmpty()
    postTitle: string;

    @ApiProperty({ type: String, minLength: 5, maxLength: 5000 })
    @IsString()
    @IsNotEmpty()
    postContent: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    postTypeName: string;

    @ApiProperty({ type: String, format: "uuid", isArray: true })
    @IsArray()
    postTagIds: string[];

    @ApiProperty({ type: Boolean })
    @IsBoolean()
    anonymous: boolean;

    constructor(partial?: Partial<PostCreationPayloadDto>) {
        Object.assign(this, partial);
    }
}
