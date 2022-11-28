import {
    SetupProfileDto,
    UpdateAvatarDto,
    UpdateBioDto,
    UpdateGenderDto,
    UpdateOpennessDto,
    UpdateSexualityDto,
} from "../../dtos";

export interface IProfileSetupService {
    setupProfile(payload: SetupProfileDto): Promise<void>;

    updateBio(payload: UpdateBioDto): Promise<void>;

    updateAvatar(payload: UpdateAvatarDto): Promise<void>;

    updateGender(payload: UpdateGenderDto): Promise<void>;

    updateSexuality(payload: UpdateSexualityDto): Promise<void>;

    updateOpenness(payload: UpdateOpennessDto): Promise<void>;
}
