import { NotificationStashPoolItem } from "../../models/notificationStashPoolItem.interface";

export interface INotificationStashPoolService {
    stashNotification(
        userId: UUID,
        message: string,
        avatar?: string,
        username?: string
    ): Promise<NotificationStashPoolItem>;

    popStashNotifications(userId: UUID): Promise<NotificationStashPoolItem[]>;

    dropStashNotification(userId: UUID): Promise<boolean>;
}
