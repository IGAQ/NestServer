import neo4j from "neo4j-driver";
import { Neo4jConfig } from "./neo4jConfig.interface";

export const createDriver = async (config: Neo4jConfig) => {
    // Create a Driver instance
    const driver = neo4j.driver(
        `${config.scheme}://${config.host}:${config.port}`,
        neo4j.auth.basic(config.username, config.password)
    );
    try {
        // Verify the connection details or throw an Error
        await driver.verifyConnectivity();
    } catch (error) {
        console.error(error);
    }
    // If everything is OK, return the driver
    return driver;
};
