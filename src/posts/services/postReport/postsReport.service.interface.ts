import { ReportPostPayloadDto } from "../../dtos";
import { ReportedProps } from "../../../users/models/toPost";

export interface IPostsReportService {
    reportPost(reportPostPayload: ReportPostPayloadDto): Promise<void>;

    getReportsForPost(postId: string): Promise<ReportedProps[]>;
}
