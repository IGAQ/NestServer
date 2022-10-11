import { RelationshipDirection } from "./decorators/relationship.decorator";

export interface EntitiesRelationshipsValue<T extends string | number | symbol, PropsType> {
	directions: RelationshipDirection[],
	relType: T,
	props: PropsType,
}

export type RelatedEntity<T extends string | number | symbol, EntityType> = {
	[key in T]: {
		relationships: EntitiesRelationshipsValue<T, object>,
		entities: Array<EntityType>,
	}
};