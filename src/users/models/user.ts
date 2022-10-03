import { ApiProperty } from "@nestjs/swagger";
import { Role } from "./role";
import { Post } from "../../posts/models";

export class User {
	@ApiProperty({ type: Number })
	userId: number;

	@ApiProperty({ type: Date })
	createdAt: Date;
	@ApiProperty({ type: Date })
	updatedAt: Date;

	@ApiProperty({ type: String })
	email: string;

	@ApiProperty({ type: String })
	username: string;
	@ApiProperty({ type: String })
	normalizedUsername: string;

	@ApiProperty({ type: String })
	passwordHash: string;
	@ApiProperty({ type: String })
	passwordSalt: string;

	@ApiProperty({ type: String })
	firstName: string;
	@ApiProperty({ type: String })
	lastName: string;

	@ApiProperty({ type: Role })
	role: Role;

	@ApiProperty({ type: Role })
	posts: Post[];
}