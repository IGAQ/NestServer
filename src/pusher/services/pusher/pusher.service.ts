import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Pusher from "pusher";
import { TriggerParams } from "pusher";
import { envKeys } from "../../pusher.constant";
import { IPusherService } from "./pusher.service.interface";
import { IPusherUserPoolService } from "../pusherUserPoolServer/pusherUserPool.service.interface";
import { _$ } from "../../../_domain/injectableTokens";
import { Response } from "node-fetch";

@Injectable({ scope: Scope.DEFAULT })
export class PusherService implements IPusherService {
    private readonly pusher: Pusher;

    constructor(
        private _configService: ConfigService,
        @Inject(_$.IPusherUserPoolService)
        private readonly _pusherUserPoolService: IPusherUserPoolService
    ) {
        console.log("connecting to pusher 🇰🇼");
        this.pusher = new Pusher({
            appId: this._configService.get<string>(envKeys.appId),
            key: this._configService.get<string>(envKeys.key),
            secret: this._configService.get<string>(envKeys.secret),
            cluster: this._configService.get<string>(envKeys.cluster),
            useTLS: this._configService.get<boolean>(envKeys.useTLS) ?? false,
        });
    }

    public async triggerUser(
        channel: string,
        event: string,
        userId: UUID,
        data: any
    ): Promise<Response[]> {
        const poolItems = await this._pusherUserPoolService.getPoolItemsByUserId(userId);
        return await Promise.all(
            poolItems.map(poolItem => {
                console.log(poolItem);
                return this.pusher.trigger(`${poolItem.poolId}-${channel}`, event, data);
            })
        );
    }

    public async trigger(
        channel: string | string[],
        event: string,
        data: any,
        params?: TriggerParams
    ): Promise<Response> {
        return await this.pusher.trigger(channel, event, data, params);
    }
}
