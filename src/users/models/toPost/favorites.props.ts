import { ApiProperty } from "@nestjs/swagger";

export class FavoritesProps {
	@ApiProperty({ type: Number })
	favoritedAt: number;
}