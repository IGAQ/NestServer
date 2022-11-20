import { LABELS_DECORATOR_KEY } from "./neo4j.constants";

export function Labels(...labels: string[]) {
    return function (target: any) {
        Reflect.defineMetadata(LABELS_DECORATOR_KEY, labels, target.prototype);
        target.labels = labels;
    };
}

// This decorator is used to mark a property as a node property
export function NodeProperty() {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return function (target: any, propertyKey: string) {};
}
