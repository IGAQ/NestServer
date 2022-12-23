import { SetupProfileDto } from "../../dtos";

export interface IProfileSetupService {
    setupProfile(payload: SetupProfileDto): Promise<void>;
}
