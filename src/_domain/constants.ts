import { Neo4jConfig } from "../neo4j/neo4jConfig.interface";

// for test purposes
export const neo4jCredentials: Neo4jConfig = {
    scheme: (process.env.NEO4J_SCHEME as any) ?? "bolt",
    host: process.env.NEO4J_HOST ?? "localhost",
    port: process.env.NEO4J_PORT ?? 7687,
    username: process.env.NEO4J_USERNAME ?? "neo4j",
    password: process.env.NEO4J_PASSWORD ?? "admin",
    database: process.env.NEO4J_DATABASE ?? "",
};
