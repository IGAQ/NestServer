import { IsString } from "class-validator";

export class HateSpeechRequestPayloadDto {
    @IsString()
    token: string;

    @IsString()
    text: string;

    constructor(partial?: Partial<HateSpeechRequestPayloadDto>) {
        Object.assign(this, partial);
    }
}
