import { Neo4jConfig } from "../neo4j/neo4jConfig.interface";

// for test purposes
export const neo4jCredentials: Neo4jConfig = {
    scheme: "bolt",
    host: "localhost",
    port: 7687,
    username: "neo4j",
    password: "admin",
    database: "",
};
