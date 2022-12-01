import { TriggerParams } from "pusher";
import { Response } from "node-fetch";

export interface IPusherService {
    triggerUser(channel: string, event: string, userId: UUID, data: any): Promise<Response[]>;

    trigger(
        channel: string | string[],
        event: string,
        data: any,
        params?: TriggerParams
    ): Promise<Response>;
}
