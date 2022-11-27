import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ChangePasswordAdminDto {
    @ApiProperty({ type: String })
    @IsString()
    newPassword: string;

    @ApiProperty({ type: String })
    @IsString()
    username: string;

    constructor(partial?: Partial<ChangePasswordAdminDto>) {
        Object.assign(this, partial);
    }
}
