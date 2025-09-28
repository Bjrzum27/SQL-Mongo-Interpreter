import { SelectStatementNode, ColumnRefNode } from '../ast';
export declare function mapColumnToPath(col: ColumnRefNode, ast: SelectStatementNode, allowTraversal?: boolean): string | undefined;
