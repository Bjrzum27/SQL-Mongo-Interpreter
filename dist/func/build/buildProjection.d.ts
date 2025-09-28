import { SelectStatementNode } from '../../ast';
export declare function buildProjection(ast: SelectStatementNode): {
    project: any;
    pathToAlias: Record<string, string>;
    includeAllBase: boolean;
} | {
    project: any;
    pathToAlias: Record<string, string>;
    includeAllBase?: undefined;
};
