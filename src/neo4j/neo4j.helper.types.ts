export interface RelationshipProps {}

export class RelatedEntityRecordItem<EntityType> {
    entity: EntityType;
    relProps: RelationshipProps;

    constructor(entity: EntityType, relProps: RelationshipProps) {
        this.entity = entity;
        this.relProps = relProps;
    }
}

export type RichRelatedEntities<EntityType, T extends string> = {
    [key in T]: {
        records: Array<RelatedEntityRecordItem<EntityType>>;
        relType: T;
    };
};
