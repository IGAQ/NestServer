import { ApiProperty } from "@nestjs/swagger";

export class DownVotesProps {
	@ApiProperty({ type: Number })
	downVotedAt: number;
}