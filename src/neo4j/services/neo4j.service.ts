import { Inject, Injectable, Logger } from "@nestjs/common";
import { NEO4J_DRIVER, NEO4J_OPTIONS } from "../neo4j.constants";
import { Driver, Result, session, Session } from "neo4j-driver";
import { Neo4jConfig } from "../neo4jConfig.interface";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class Neo4jService {
    private readonly _logger = new Logger(Neo4jService.name);
    private readonly _driver: Driver;
    private readonly _config: Neo4jConfig;

    constructor(@Inject(NEO4J_OPTIONS) config: Neo4jConfig, @Inject(NEO4J_DRIVER) driver: Driver) {
        this._driver = driver;
        this._config = config;
    }

    public generateId(): string {
        return uuidv4();
    }

    public getReadSession(database?: string): Session {
        return this._driver.session({
            database: database || this._config.database,
            defaultAccessMode: session.READ,
        });
    }

    public getWriteSession(database?: string): Session {
        return this._driver.session({
            database: database || this._config.database,
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

    public async tryWriteAsync(
        cypher: string,
        params: Record<string, any>,
        database?: string
    ): Promise<Result> {
        const session = this.getWriteSession(database);
        try {
            // console.debug(cypher, "cypher", params, "params");
            return await session.run(cypher, params);
        } catch (error) {
            this._logger.debug(error);
            await session.close();
        }
    }

    public async tryReadAsync(
        cypher: string,
        params: Record<string, any>,
        database?: string
    ): Promise<Result> {
        const session = this.getReadSession(database);
        try {
            // console.debug(cypher, "cypher", params, "params");
            return await session.run(cypher, params);
        } catch (error) {
            this._logger.debug(error);
            await session.close();
        }
    }
}
