import { LABELS_DECORATOR_KEY } from "./neo4j.constants";

export function Labels(...labels: string[]) {
    return function (target: any) {
        Reflect.defineMetadata(LABELS_DECORATOR_KEY, labels, target.prototype);
        target.labels = labels;
    };
}
