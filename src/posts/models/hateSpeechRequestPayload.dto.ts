export class HateSpeechRequestPayloadDto {
    token: string;

    text: string;

    constructor(partial?: Partial<HateSpeechRequestPayloadDto>) {
        Object.assign(this, partial);
    }
}
