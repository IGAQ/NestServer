import { IsInstance, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { User } from "../../users/models";

export class ChangePasswordUserDto {
    @ApiProperty({ type: String })
    @IsString()
    previousPassword: string;

    @ApiProperty({ type: String })
    @IsString()
    newPassword: string;

    @IsInstance(User)
    @Exclude()
    user: User;

    constructor(partial?: Partial<ChangePasswordUserDto>) {
        Object.assign(this, partial);
    }
}
