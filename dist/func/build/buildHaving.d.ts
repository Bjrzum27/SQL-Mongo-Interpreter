import { ExpressionNode, ColumnRefNode } from '../../ast';
export declare function buildHaving(expr: ExpressionNode, groupByCols: ColumnRefNode[] | undefined, accumulators: any, postProject: Record<string, any>, aliasBySignature: Map<string, string>): any;
