import { ApiProperty } from "@nestjs/swagger";

export class UpVotesProps {
	@ApiProperty({ type: Number })
	upVotedAt: number;
}