export interface RelationshipProps {}

export type RelatedEntity<EntityType, T extends string | number | symbol> = {
    [key in T]: {
        entities: Array<EntityType>;
        relType: T;
        relProps: RelationshipProps;
    };
};
