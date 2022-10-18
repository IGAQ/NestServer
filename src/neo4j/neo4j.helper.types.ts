import { Neo4jService } from "./services/neo4j.service";

export interface RelationshipProps {}

export class RelatedEntityRecordItem<EntityType, RelType> {
    entity: EntityType;
    relProps: RelType;

    constructor(object: Partial<RelatedEntityRecordItem<EntityType, RelType>>) {
        Object.assign(this, object);
    }
}

export class RelatedEntityRecord<EntityType, RelType, T extends string> {
    records: Array<RelatedEntityRecordItem<EntityType, RelType>>;
    relType: T;

    constructor(object: Partial<RelatedEntityRecord<EntityType, RelType, T>>) {
        Object.assign(this, object);
    }
}

export type RichRelatedEntities<EntityType, T extends string> = {
    [key in T]: RelatedEntityRecord<EntityType, RelationshipProps, T>;
};

export class Model {
    protected neo4jService: Neo4jService;

    constructor(neo4jService: Neo4jService) {
        this.neo4jService = neo4jService;
    }
}
