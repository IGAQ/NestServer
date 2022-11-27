import { IsNumber, IsString } from "class-validator";

export class HateSpeechResponseDto {
    @IsString()
    response: string;

    @IsString()
    class: string;

    @IsNumber()
    confidence: number;

    constructor(partial?: Partial<HateSpeechResponseDto>) {
        Object.assign(this, partial);
    }
}
