import { Neo4jService } from "./services/neo4j.service";

export interface RelationshipProps {}

export class RelatedEntityRecordItem<EntityType, RelType> {
    entity: EntityType;
    relProps: RelType;

    constructor(entity: EntityType, relProps: RelType) {
        this.entity = entity;
        this.relProps = relProps;
    }
}

export type RichRelatedEntities<EntityType, T extends string> = {
    [key in T]: {
        records: Array<RelatedEntityRecordItem<EntityType, RelationshipProps>>;
        relType: T;
    };
};

export class Model {
    protected neo4jService: Neo4jService;

    constructor(neo4jService: Neo4jService) {
        this.neo4jService = neo4jService;
    }
}
