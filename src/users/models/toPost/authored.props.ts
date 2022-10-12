import { ApiProperty } from "@nestjs/swagger";

export class AuthoredProps {
	@ApiProperty({ type: Number })
	authoredAt: number;
}