import { IProfileSetupService } from "./profileSetup.service.interface";
import { SetupProfileDto } from "../../dtos";
import { HttpException, Inject, Injectable, Scope } from "@nestjs/common";
import { Request } from "express";
import { REQUEST } from "@nestjs/core";
import { User } from "../../models";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { _$ } from "../../../_domain/injectableTokens";
import { HasSexualityProps } from "../../models/toSexuality";
import { HasGenderProps } from "../../models/toGender";
import { HasOpennessProps } from "../../models/toOpenness";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileSetupService implements IProfileSetupService {
    private readonly _request: Request;
    private readonly _dbContext: DatabaseContext;

    constructor(
        @Inject(REQUEST) request: Request,
        @Inject(_$.IDatabaseContext) dbContext: DatabaseContext
    ) {
        this._request = request;
        this._dbContext = dbContext;
    }

    public async setupProfile(payload: SetupProfileDto): Promise<void> {
        const user: User = this.getUserFromRequest();

        user.bio = payload.bio;
        user.avatar = payload.avatar;
        await this._dbContext.Users.updateUser(user);

        const userSexuality = await user.getSexuality();
        const sexuality = await this._dbContext.Sexualities.findSexualityById(payload.sexualityId);
        if (!sexuality) throw new HttpException("Sexuality not found.", 404);
        if (userSexuality === null) {
            await this._dbContext.Users.connectUserWithSexuality(
                user.userId,
                sexuality.sexualityId,
                new HasSexualityProps({ isPrivate: !payload.isSexualityOpen })
            );
        } else {
            // If the sexuality is changed, update it. else, skip.
            if (userSexuality.sexualityId !== payload.sexualityId) {
                // Delete the relationship first.
                await this._dbContext.Users.detachUserWithSexuality(user.userId);
                // Connect with the new one.
                await this._dbContext.Users.connectUserWithSexuality(
                    user.userId,
                    sexuality.sexualityId,
                    new HasSexualityProps({ isPrivate: !payload.isSexualityOpen })
                );
            } else {
                // If the privacy rule of sexuality of this user has changed, just update the relationship property
                if (!payload.isSexualityOpen !== user.isSexualityPrivate) {
                    await this._dbContext.Users.updateRelationshipPropsOfHasSexuality(
                        user.userId,
                        new HasSexualityProps({ isPrivate: !payload.isSexualityOpen })
                    );
                }
            }
        }

        const userGender = await user.getGender();
        const gender = await this._dbContext.Genders.findGenderById(payload.genderId);
        if (!gender) throw new HttpException("Gender not found.", 404);
        if (userGender === null) {
            await this._dbContext.Users.connectUserWithGender(
                user.userId,
                gender.genderId,
                new HasGenderProps({ isPrivate: payload.isGenderPrivate })
            );
        } else {
            // If the gender is changed, update it. else, skip.
            if (userGender.genderId !== payload.genderId) {
                // Delete the relationship first.
                await this._dbContext.Users.detachUserWithGender(user.userId);
                // Connect with the new one.
                await this._dbContext.Users.connectUserWithGender(
                    user.userId,
                    gender.genderId,
                    new HasGenderProps({ isPrivate: payload.isGenderPrivate })
                );
            } else {
                // If the privacy rule of gender of this user has changed, just update the relationship property
                if (payload.isGenderPrivate !== user.isGenderPrivate) {
                    await this._dbContext.Users.updateRelationshipPropsOfHasGender(
                        user.userId,
                        new HasGenderProps({ isPrivate: payload.isGenderPrivate })
                    );
                }
            }
        }

        const userOpenness = await user.getOpenness();
        const openness = await this._dbContext.Openness.findOpennessById(payload.opennessId);
        if (!openness) throw new HttpException("Openness not found.", 404);
        if (userOpenness === null) {
            await this._dbContext.Users.connectUserWithOpenness(
                user.userId,
                openness.opennessId,
                new HasOpennessProps({ isPrivate: payload.isGenderPrivate })
            );
        } else {
            // If the openness is changed, update it. else, skip.
            if (userOpenness.opennessId !== payload.opennessId) {
                // Delete the relationship first.
                await this._dbContext.Users.detachUserWithOpenness(user.userId);
                // Connect with the new one.
                await this._dbContext.Users.connectUserWithOpenness(
                    user.userId,
                    openness.opennessId,
                    new HasOpennessProps({ isPrivate: payload.isGenderPrivate })
                );
            } else {
                // If the privacy rule of openness of this user has changed, just update the relationship property
                if (payload.isOpennessPrivate !== user.isOpennessPrivate) {
                    await this._dbContext.Users.updateRelationshipPropsOfHasOpenness(
                        user.userId,
                        new HasOpennessProps({ isPrivate: payload.isOpennessPrivate })
                    );
                }
            }
        }
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new HttpException("Authentication failed.", 403);
        return user;
    }
}
