import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";

export class UserDto {
    @ApiProperty({ type: Number })
    userId: number;

    @ApiProperty({ type: String })
    username: string;

    @Exclude()
    @ApiProperty({ type: String })
    password: string;

    @ApiProperty({ type: String })
    email: string;

    constructor(partial?: Partial<UserDto>) {
        Object.assign(this, partial);
    }
}
