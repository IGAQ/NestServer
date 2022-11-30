import { ReportCommentPayloadDto } from "../../../moderation/dtos/userActions";
import { ReportedProps } from "../../../users/models/toComment";

export interface ICommentsReportService {
    reportComment(reportCommentPayload: ReportCommentPayloadDto): Promise<void>;

    getReportsForComment(commentId: UUID): Promise<ReportedProps[]>;
}
