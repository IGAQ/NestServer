import neo4j from "neo4j-driver";
import { Neo4jConfig } from "./neo4jConfig.interface";
import { Logger } from "@nestjs/common";

export const createDriver = async (config: Neo4jConfig) => {
    const logger = new Logger("Neo4jService");
    // Create a Driver instance
    const driver = neo4j.driver(
        `${config.scheme}://${config.host}:${config.port}`,
        neo4j.auth.basic(config.username, config.password)
    );
    try {
        logger.log("Connecting to Neo4j Server... ⏳");
        // Verify the connection details or throw an Error
        await driver.verifyConnectivity();
        logger.log("Connected to Neo4j Server Successfully ✅");
    } catch (error) {
        console.error(error);
    }
    // If everything is OK, return the driver
    return driver;
};

export const fixNeo4jIntegers = (obj: any, propertyNames: string[]): any => {
    for (const propertyName of propertyNames) {
        obj[propertyName] = obj[propertyName]?.low ?? obj[propertyName];
    }
    return obj;
};
