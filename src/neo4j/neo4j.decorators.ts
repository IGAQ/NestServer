export function Labels(...labels: string[]) {
    return function (target: any) {
        Reflect.defineMetadata("labels", labels, target.prototype);
        target.prototype.labels = labels;
    };
}
