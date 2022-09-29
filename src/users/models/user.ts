import { ApiProperty } from "@nestjs/swagger";

export default class User {
    @ApiProperty({ type: Number })
    userId: number;

    @ApiProperty({ type: String })
    username: string;

    @ApiProperty({ type: String })
    password: string;

    @ApiProperty({ type: String })
    email: string;
}
