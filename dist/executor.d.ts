import { type CompileOptions } from './compiler';
import { SelectStatementNode, UpdateStatementNode } from './ast';
export interface MongoLikeCollection {
    aggregate(pipeline: any[]): {
        toArray(): Promise<any[]>;
    };
    updateMany(filter: any, update: any, options?: any): Promise<any>;
    updateOne?(filter: any, update: any, options?: any): Promise<any>;
}
export interface MongoLikeConnection {
    collection(name: string): MongoLikeCollection;
}
export interface SqlExecutorOptions extends CompileOptions {
    debug?: boolean;
    returnUpdatedDocs?: boolean;
}
export declare class SqlExecutor {
    private readonly connection;
    private correlatedLookupCounter;
    private correlatedVarCounter;
    constructor(connection: MongoLikeConnection);
    execute(sql: string, options?: SqlExecutorOptions): Promise<{
        ast: UpdateStatementNode;
        filter: Record<string, any>;
        update: any[];
        result: any;
        data: any[] | undefined;
    } | {
        ast: SelectStatementNode;
        pipeline: any[];
        data: any[];
    }>;
    private executeUpdate;
    private resolveScalarSubqueriesInUpdate;
    private executeCorrelatedUpdate;
    private getValueAtPath;
    private resolveSubqueries;
    private processInExpression;
    private processExistsExpression;
    private markCorrelatedReferences;
    private collectAliases;
    private determineSubqueryOutputField;
    private buildReturningInfo;
    private evaluateProjectSpec;
    private getValueFromDoc;
    private evaluateMongoExpression;
    private evaluateMongoExpressionWithVars;
    private addUnitToDate;
}
