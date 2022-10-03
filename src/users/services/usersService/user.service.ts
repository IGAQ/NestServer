import { Inject, Injectable } from "@nestjs/common";
import { UserDto, RegisterUserPayloadDto } from "../../models";
import { IUsersService } from "./users.service.interface";
import { IPrismaService } from "../../../databaseAccessLayer/prisma.service.interface";

@Injectable()
export class UsersService implements IUsersService {
	constructor(@Inject("IPrismaService") private _prismaService: IPrismaService) {
	}

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
		const newUser = new UserDto();
		newUser.username = user.username;
		newUser.password = user.password;
		newUser.email = user.email;

		this._prismaService.user.create({ data: newUser as any });
	}
}
