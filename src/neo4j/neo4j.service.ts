import { Inject, Injectable } from "@nestjs/common";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "./neo4j.constants";
import { Driver, Result, session, Session } from "neo4j-driver";
import { Neo4jConfig } from "./neo4jConfig.interface";

@Injectable()
export class Neo4jService {
	private readonly driver: Driver;
	private readonly config: Neo4jConfig;

	constructor(
		@Inject(NEO4J_OPTIONS) config: Neo4jConfig,
		@Inject(NEO4J_DRIVER) driver: Driver
	) {
		this.driver = driver
		this.config = config
	}

	public getReadSession(database?: string): Session {
		return this.driver.session({
			database: database || this.config.database,
			defaultAccessMode: session.READ,
		});
	}

	public getWriteSession(database?: string): Session {
		return this.driver.session({
			database: database || this.config.database,
			defaultAccessMode: session.WRITE,
		});
	}

	public read(cypher: string, params: Record<string, any>, database?: string): Result {
		const session = this.getReadSession(database);
		return session.run(cypher, params);
	}

	public write(cypher: string, params: Record<string, any>, database?: string): Result {
		const session = this.getWriteSession(database);
		return session.run(cypher, params);
	}
}
