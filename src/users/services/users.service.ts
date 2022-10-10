import { Inject, Injectable } from "@nestjs/common";
import { UserDto, RegisterUserPayloadDto } from "../models";
import { IUsersService } from "./users.service.interface";
import { Neo4jService } from "../../neo4j/neo4j.service";

@Injectable()
export class UsersServicePrisma implements IUsersService {
	constructor(
		@Inject(Neo4jService) private _neo4jService: Neo4jService
	) {}

	public async findAll(): Promise<any> {
		throw new Error("Method not implemented.");
	}

	public async findUserByUsername(username: string): Promise<UserDto | undefined> {
		throw new Error("Method not implemented.");
	}

	public async findUserById(userId: number): Promise<UserDto | undefined> {
		throw new Error("Method not implemented.");
	}

	public async addUser(user: RegisterUserPayloadDto): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
