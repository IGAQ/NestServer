import { ApiProperty } from "@nestjs/swagger";

export class PostTag {
	@ApiProperty({ type: String, format: "uuid" })
	tagId: string;

	@ApiProperty({ type: String })
	tagName: string;

	constructor(partial?: Partial<PostTag>) {
		Object.assign(this, partial);
	}
}