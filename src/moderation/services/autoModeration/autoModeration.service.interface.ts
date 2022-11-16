export interface IAutoModerationService {
    checkForHateSpeech(text: string): Promise<boolean>;
}
