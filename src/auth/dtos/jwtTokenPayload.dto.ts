import { IsString, IsUUID } from "class-validator";

export class JwtTokenPayloadDto {
    @IsUUID()
    sub: UUID;

    @IsString()
    username: string;

    constructor(partials?: Partial<JwtTokenPayloadDto>) {
        Object.assign(this, partials);
    }
}
