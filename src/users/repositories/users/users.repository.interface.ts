import { User } from "../../models";
import { HasGenderProps } from "../../models/toGender";
import { HasOpennessProps } from "../../models/toOpenness";
import { HasSexualityProps } from "../../models/toSexuality";
import { GotBannedProps } from "../../models/toSelf";

export interface IUsersRepository {
    findAll(): Promise<User[]>;

    findUserByUsername(username: string): Promise<User | undefined>;

    findUserByEmail(email: string): Promise<User | undefined>;

    findUserById(userId: UUID): Promise<User | undefined>;

    addUser(user: User): Promise<User>;

    updateUser(user: User): Promise<void>;

    deleteUser(userId: UUID): Promise<void>;

    connectUserWithSexuality(
        userId: UUID,
        sexualityId: UUID,
        hasSexualityProps: HasSexualityProps
    ): Promise<void>;
    detachUserWithSexuality(userId: UUID): Promise<void>;
    updateRelationshipPropsOfHasSexuality(
        userId: UUID,
        hasSexualityProps: HasSexualityProps
    ): Promise<void>;

    connectUserWithGender(
        userId: UUID,
        genderId: UUID,
        hasGenderProps: HasGenderProps
    ): Promise<void>;
    detachUserWithGender(userId: UUID): Promise<void>;
    updateRelationshipPropsOfHasGender(userId: UUID, hasGenderProps: HasGenderProps): Promise<void>;

    connectUserWithOpenness(
        userId: UUID,
        opennessId: UUID,
        hasOpennessProps: HasOpennessProps
    ): Promise<void>;
    detachUserWithOpenness(userId: UUID): Promise<void>;
    updateRelationshipPropsOfHasOpenness(
        userId: UUID,
        hasGenderProps: HasGenderProps
    ): Promise<void>;

    banUser(userId: UUID, banProps: GotBannedProps): Promise<void>;

    unbanUser(userId: UUID): Promise<void>;

    addPreviouslyBanned(userId: UUID, banProps: GotBannedProps): Promise<void>;
}
