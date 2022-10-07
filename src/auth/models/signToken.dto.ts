import { ApiProperty } from "@nestjs/swagger";

export class SignTokenDto {
    @ApiProperty({ type: String })
    access_token: string;

    constructor(partial?: Partial<SignTokenDto>) {
        Object.assign(this, partial);
    }
}
