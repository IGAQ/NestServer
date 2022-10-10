import { Inject, Injectable } from "@nestjs/common";
import { UserDto, RegisterUserPayloadDto } from "../../models";
import { IUsersService } from "../users.service.interface";
import { IPrismaService } from "../../../prisma/prisma.service.interface";

@Injectable()
export class UsersServicePrisma implements IUsersService {
    constructor(
        @Inject("IPrismaService") private _prismaService: IPrismaService,
    ) {}

    public async findAll(): Promise<any> {
        return await this._prismaService.user.findMany();
    }

    public async findUserByUsername(username: string): Promise<UserDto | undefined> {
        const foundUser = await this._prismaService.user.findFirst({ where: { username } });

        return foundUser as any;
    }

    public async findUserById(userId: number): Promise<UserDto | undefined> {
        const foundUser = await this._prismaService.user.findUnique({ where: { userId } });

        return foundUser as any;
    }

    public async addUser(user: RegisterUserPayloadDto): Promise<void> {
        const newUser = new UserDto({
            username: user.username,
            email: user.email,
            password: user.password,
        });

        this._prismaService.user.create({ data: newUser as any });
    }
}
