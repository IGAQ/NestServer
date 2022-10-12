import { ApiProperty } from "@nestjs/swagger";

export class AuthoredProps {
	@ApiProperty({ type: Number })
	authoredAt: number;

	@ApiProperty({ type: Boolean })
	anonymously: boolean;
}