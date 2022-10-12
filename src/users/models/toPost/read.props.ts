import { ApiProperty } from "@nestjs/swagger";

export class ReadProps {
	@ApiProperty({ type: Number })
	readAt: number;
}