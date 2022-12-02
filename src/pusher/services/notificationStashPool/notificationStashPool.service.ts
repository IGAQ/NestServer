import { INotificationStashPoolService } from "./notificationStashPool.service.interface";
import { Injectable, Scope } from "@nestjs/common";
import { NotificationStashPoolItem } from "../../models/notificationStashPoolItem.interface";

@Injectable({ scope: Scope.DEFAULT })
export class NotificationStashPoolService implements INotificationStashPoolService {
    private readonly notificationStashPool: Map<UUID, NotificationStashPoolItem[]> = new Map<
        UUID,
        NotificationStashPoolItem[]
    >();

    public async stashNotification(
        stashToken: UUID,
        userId: UUID,
        message: string,
        avatar?: string,
        username?: string
    ): Promise<NotificationStashPoolItem> {
        const createdStash: NotificationStashPoolItem = {
            stashToken, // aka notificationId
            message,
            avatar,
            username,
            userId,
            pushedAt: Date.now(),
        };

        const foundStash = this.notificationStashPool.get(userId);
        if (!foundStash) {
            this.notificationStashPool.set(userId, [createdStash]);
            return createdStash;
        }

        this.notificationStashPool.set(userId, [...foundStash, createdStash]);
        return createdStash;
    }

    public async popStashNotifications(userId: UUID): Promise<NotificationStashPoolItem[]> {
        const foundStash = this.notificationStashPool.get(userId);
        if (!foundStash) {
            return [];
        }

        this.dropStashNotification(userId);

        return foundStash;
    }

    public async dropStashNotification(userId: UUID): Promise<boolean> {
        return this.notificationStashPool.delete(userId);
    }
}
