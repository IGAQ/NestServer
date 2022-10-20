export class HateSpeechResponseDto {
    response: string;

    class: string;

    confidence: number;

    constructor(partial?: Partial<HateSpeechResponseDto>) {
        Object.assign(this, partial);
    }
}
