export interface NotificationStashPoolItem {
    userId: UUID;

    username?: string;
    avatar?: string;

    stashToken: UUID;

    message: string;

    pushedAt: number;
}
