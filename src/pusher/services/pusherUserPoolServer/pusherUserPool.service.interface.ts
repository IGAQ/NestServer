import { PusherUserPoolItem } from "../../models/pusherUserPoolItem.interface";

export interface IPusherUserPoolService {
    addUserToPool(userId: UUID): Promise<string>;

    getPoolItemsByUserId(userId: UUID): Promise<PusherUserPoolItem[]>;

    getPoolItemByPoolId(poolId: string): Promise<PusherUserPoolItem | undefined>;

    removePoolId(poolId: string, userId?: UUID): Promise<void>;
}
