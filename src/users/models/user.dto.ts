import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Role } from "./role";

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

    @ApiProperty({ type: [Role] })
    roles: Role[];

    constructor(partial?: Partial<UserDto>) {
        Object.assign(this, partial);
    }
}
