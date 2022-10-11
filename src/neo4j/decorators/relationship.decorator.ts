const relationshipMetaDataKey = Symbol("relationship");

export enum RelationshipDirection {
	INCOMING = "INCOMING",
	OUTGOING = "OUTGOING",
}

export function Relationship(relationshipType: string, direction: RelationshipDirection) {
	return (target: any, key: string) => {
		const type = Reflect.getMetadata(relationshipMetaDataKey, target, key);
		if (!type) {
			throw new Error(`Cannot determine type of ${key}`);
		}
		const relationships = Reflect.getMetadata(relationshipMetaDataKey, target) || [];
		relationships.push({
			relationshipType: relationshipType,
			direction: direction,
		});
		Reflect.defineMetadata(relationshipMetaDataKey, relationships, target);
	};
}