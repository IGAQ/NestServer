import { ReportPostPayloadDto } from "../../../dtos/userActions";
import { ReportedProps } from "../../../../users/models/toPost";

export interface IPostsReportService {
    reportPost(reportPostPayload: ReportPostPayloadDto): Promise<void>;

    getReportsForPost(postId: UUID): Promise<ReportedProps[]>;
}
