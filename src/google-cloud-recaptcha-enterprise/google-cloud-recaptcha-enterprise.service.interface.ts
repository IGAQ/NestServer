import { AssessmentDto } from "./models/assessment.dto";

export interface IGoogleCloudRecaptchaEnterpriseService {
    createAssessment(assessmentPayload: AssessmentDto): Promise<number | null>;
}
