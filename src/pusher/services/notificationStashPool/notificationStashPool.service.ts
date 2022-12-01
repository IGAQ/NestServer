import { INotificationStashPoolService } from "./notificationStashPool.service.interface";
import { Injectable, Scope } from "@nestjs/common";
import { NotificationStashPoolItem } from "../../models/notificationStashPoolItem.interface";
import { generateUUID } from "../../../_domain/utils";

@Injectable({ scope: Scope.DEFAULT })
export class NotificationStashPoolService implements INotificationStashPoolService {
    private readonly notificationStashPool: Map<UUID, NotificationStashPoolItem[]>;

    public async stashNotification(
        userId: UUID,
        message: string,
        avatar?: string,
        username?: string
    ): Promise<NotificationStashPoolItem> {
        const createdStash: NotificationStashPoolItem = {
            stashToken: generateUUID(), // aka notificationId
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
    }

    public async popStashNotifications(userId: UUID): Promise<NotificationStashPoolItem[]> {
        const foundStash = this.notificationStashPool.get(userId);
        if (!foundStash) {
            return [];
        }

        this.notificationStashPool.delete(userId);
        return foundStash;
    }

    public async dropStashNotification(userId: UUID): Promise<boolean> {
        return this.notificationStashPool.delete(userId);
    }
}
