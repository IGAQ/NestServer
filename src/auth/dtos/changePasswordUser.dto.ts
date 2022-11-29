import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../users/models";

export class ChangePasswordUserDto {
    @ApiProperty({ type: String })
    @IsString()
    previousPassword: string;

    @ApiProperty({ type: String })
    @IsString()
    newPassword: string;

    user: User;

    constructor(partial?: Partial<ChangePasswordUserDto>) {
        Object.assign(this, partial);
    }
}
