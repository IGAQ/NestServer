import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
    @ApiProperty({ type: Number })
    userId: number;

    @ApiProperty({ type: String })
    username: string;

    @ApiProperty({ type: String })
    password: string;

    @ApiProperty({ type: String })
    email: string;
}
