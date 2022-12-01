import { Injectable, Logger, Scope } from "@nestjs/common";
import { makeStringId } from "../../../_domain/utils";
import { IPusherUserPoolService } from "./pusherUserPool.service.interface";
import { PusherUserPoolItem } from "../../models/pusherUserPoolItem.interface";

@Injectable({ scope: Scope.DEFAULT })
export class PusherUserPoolService implements IPusherUserPoolService {
    private readonly _logger = new Logger(PusherUserPoolService.name);

    private readonly pusherUserPool: Map<string, PusherUserPoolItem> = new Map<
        string,
        PusherUserPoolItem
    >();
    private readonly pusherUserIdToPoolIds: Map<UUID, string[]> = new Map<UUID, string[]>();

    constructor() {
        this.maintainPool();
    }

    public async addUserToPool(userId: UUID): Promise<string> {
        const poolId = makeStringId(6);

        // don't wait
        setTimeout(() => {
            this.pusherUserPool.set(poolId, {
                poolId,
                userId,
                lastAccessedAt: Date.now(),
                createdAt: Date.now(),
            });

            // add the poolId to the dictionary of userId->poolIds
            const poolIdsOfUser = this.pusherUserIdToPoolIds.get(userId);
            if (poolIdsOfUser) {
                this.pusherUserIdToPoolIds.set(userId, [...poolIdsOfUser, poolId]);
            } else {
                this.pusherUserIdToPoolIds.set(userId, [poolId]);
            }
        });

        return poolId;
    }

    public async getPoolItemsByUserId(userId: UUID): Promise<PusherUserPoolItem[]> {
        const foundPoolIds = this.pusherUserIdToPoolIds.get(userId);
        if (!foundPoolIds) {
            return [];
        }

        return (
            await Promise.all(foundPoolIds.map(async poolId => this.getPoolItemByPoolId(poolId)))
        ).filter(i => i !== undefined);
    }

    public async getPoolItemByPoolId(poolId: string): Promise<PusherUserPoolItem | undefined> {
        const foundPoolItem = this.pusherUserPool.get(poolId);
        if (!foundPoolItem) {
            return undefined;
        }

        // touch the pool item and update its `lastAccessedAt` for future maintenance.
        setTimeout(() => {
            this.pusherUserPool.set(poolId, {
                poolId,
                userId: foundPoolItem.userId,
                lastAccessedAt: Date.now(),
                createdAt: foundPoolItem.createdAt,
            });
        });

        return foundPoolItem;
    }

    public async removePoolId(poolId: string, userId?: UUID): Promise<void> {
        // remove it from the userId->poolIds dictionary first.
        if (userId) {
            const foundPoolIds = this.pusherUserIdToPoolIds.get(userId);
            if (foundPoolIds && foundPoolIds.includes(poolId)) {
                this.pusherUserIdToPoolIds.set(userId, [
                    ...foundPoolIds.filter(pi => pi !== poolId),
                ]);
            }
        } else {
            for (const poolIds of this.pusherUserIdToPoolIds.values()) {
                if (poolIds.includes(poolId)) {
                    this.pusherUserIdToPoolIds.set(userId, [
                        ...poolIds.filter(pi => pi !== poolId),
                    ]);
                }
            }
        }

        // then remove it from UserPool
        this.pusherUserPool.delete(poolId);
    }

    private async maintainPool(): Promise<void> {
        setTimeout(async () => {
            this.pusherUserPool.forEach((poolItem, poolId) => {
                if (Date.now() - poolItem.lastAccessedAt > 30 * 60) {
                    this._logger.verbose(
                        `PusherUserPool Maintenance: Removing inactive pool item -> poolId = ${poolItem.poolId}. PoolItem: `,
                        poolItem
                    );
                    this.removePoolId(poolId);
                }
            });
        }, 10000);
    }
}
