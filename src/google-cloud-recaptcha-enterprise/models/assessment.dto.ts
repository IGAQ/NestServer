import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { UserActionsEnum } from "./userActions.enum";

export class AssessmentDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsEnum(UserActionsEnum)
    recaptchaAction: UserActionsEnum;

    constructor(partial?: Partial<AssessmentDto>) {
        Object.assign(this, partial);
    }
}
