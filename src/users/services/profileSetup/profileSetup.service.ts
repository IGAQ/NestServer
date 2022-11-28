import { IProfileSetupService } from "./profileSetup.service.interface";
import {
    SetupProfileDto,
    UpdateAvatarDto,
    UpdateBioDto,
    UpdateGenderDto,
    UpdateOpennessDto,
    UpdateSexualityDto,
} from "../../dtos";
import { HttpException, Inject, Injectable, Scope } from "@nestjs/common";
import { Request } from "express";
import { REQUEST } from "@nestjs/core";
import { User } from "../../models";
import { DatabaseContext } from "../../../database-access-layer/databaseContext";
import { _$ } from "../../../_domain/injectableTokens";
import { UserToSexualityRelTypes } from "../../models/toSexuality";
import { UserToGenderRelTypes } from "../../models/toGender";
import { UserToOpennessRelTypes } from "../../models/toOpenness";

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
        if (userSexuality === null) {
            const sexuality = await this._dbContext.Sexualities.findSexualityById(
                payload.sexualityId
            );
            if (!sexuality) throw new HttpException("Sexuality not found.", 404);

            await this._dbContext.neo4jService.tryWriteAsync(
                `
                MATCH (u:User { userId: $userId }), (s:Sexuality { sexualityId: $sexualityId })
                    MERGE (u)-[:${UserToSexualityRelTypes.HAS_SEXUALITY} {
                        isPrivate: $isPrivate
                    }]->(s)
                `,
                {
                    userId: user.userId,
                    sexualityId: sexuality.sexualityId,
                    isPrivate: payload.isSexualityOpen,
                }
            );
        } else {
            if (payload.isSexualityOpen !== user.isSexualityPrivate) {
                await this._dbContext.neo4jService.tryWriteAsync(
                    `
                    MATCH (u:User { userId: $userId })-[r:${UserToSexualityRelTypes.HAS_SEXUALITY}]->(s:Sexuality)
                        SET r.isPrivate = $isPrivate
                    `,
                    {
                        userId: user.userId,
                        isPrivate: payload.isSexualityOpen,
                    }
                );
            }
        }

        const userGender = await user.getGender();
        if (userGender === null) {
            const gender = await this._dbContext.Genders.findGenderById(payload.genderId);
            if (!gender) throw new HttpException("Gender not found.", 404);

            await this._dbContext.neo4jService.tryWriteAsync(
                `
                MATCH (u:User { userId : $userId }), (g:Gender { genderId: $genderId })
                    MERGE (u)-[:${UserToGenderRelTypes.HAS_GENDER} {
                        isPrivate: $isPrivate
                    }]->(g)
                    `,
                {
                    userId: user.userId,
                    genderId: gender.genderId,
                    isPrivate: payload.isGenderPrivate,
                }
            );
        } else {
            if (payload.isGenderPrivate !== user.isGenderPrivate) {
                await this._dbContext.neo4jService.tryWriteAsync(
                    `
                    MATCH (u:User { userId: $userId })-[r:${UserToGenderRelTypes.HAS_GENDER}]->(g:Gender)
                        SET r.isPrivate = $isPrivate
                    `,
                    {
                        userId: user.userId,
                        isPrivate: payload.isSexualityOpen,
                    }
                );
            }
        }

        const userOpenness = await user.getOpenness();
        if (userOpenness === null) {
            const openness = await this._dbContext.Openness.findOpennessById(payload.opennessId);
            if (!openness) throw new HttpException("Openness not found.", 404);

            await this._dbContext.neo4jService.tryWriteAsync(
                `
                MATCH (u:User { userId : $userId }), (g:Openness { opennessId: $opennessId })
                    MERGE (u)-[:${UserToOpennessRelTypes.HAS_OPENNESS_LEVEL_OF} {
                        isPrivate: $isPrivate
                    }]->(g)
                    `,
                {
                    userId: user.userId,
                    opennessId: openness.opennessId,
                    isPrivate: payload.isGenderPrivate,
                }
            );
        } else {
            if (payload.isOpennessPrivate !== user.isOpennessPrivate) {
                await this._dbContext.neo4jService.tryWriteAsync(
                    `
                    MATCH (u:User { userId: $userId })-[r:${UserToOpennessRelTypes.HAS_OPENNESS_LEVEL_OF}]->(o:Openness)
                        SET r.isPrivate = $isPrivate
                    `,
                    {
                        userId: user.userId,
                        isPrivate: payload.isSexualityOpen,
                    }
                );
            }
        }
    }

    public async updateBio(payload: UpdateBioDto): Promise<void> {
        const user: User = this.getUserFromRequest();
        throw new Error("Method not implemented.");
    }

    public async updateAvatar(payload: UpdateAvatarDto): Promise<void> {
        const user: User = this.getUserFromRequest();
        throw new Error("Method not implemented.");
    }

    public async updateGender(payload: UpdateGenderDto): Promise<void> {
        const user: User = this.getUserFromRequest();
        throw new Error("Method not implemented.");
    }

    public async updateSexuality(payload: UpdateSexualityDto): Promise<void> {
        const user: User = this.getUserFromRequest();
        throw new Error("Method not implemented.");
    }

    public async updateOpenness(payload: UpdateOpennessDto): Promise<void> {
        const user: User = this.getUserFromRequest();
        throw new Error("Method not implemented.");
    }

    private getUserFromRequest(): User {
        const user = this._request.user as User;
        if (user === undefined) throw new HttpException("Authentication failed.", 403);
        return user;
    }
}
