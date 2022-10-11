import { Inject, Injectable } from "@nestjs/common";
import { UserDto, RegisterUserPayloadDto, User } from "../../models";
import { IUsersService } from "../users.service.interface";
import { IPrismaService } from "../../../prisma/prisma.service.interface";

@Injectable()
export class UsersServicePrisma implements IUsersService {
    constructor(
        @Inject("IPrismaService") private _prismaService: IPrismaService,
    ) {}

    public async findAll(): Promise<User[]> {
        // @ts-ignore
        return (await this._prismaService.user.findMany()).map((user) => new User(user)) ?? [];
    }

    public async findUserByUsername(username: string): Promise<User | undefined> {
        const foundUser = await this._prismaService.user.findFirst({ where: { username } });

        return foundUser as any;
    }

    public async findUserById(userId: string): Promise<User | undefined> {
        const foundUser = await this._prismaService.user.findUnique({ where: { userId: Number(userId) } });

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

    public async updateUser(user: User): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
