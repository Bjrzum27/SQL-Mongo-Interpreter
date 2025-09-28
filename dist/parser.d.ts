import { SelectStatementNode, UpdateStatementNode } from './ast';
export declare function parseToAst(sql: string): SelectStatementNode | UpdateStatementNode;
