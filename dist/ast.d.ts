export interface SelectStatementNode {
    type: 'SelectStatement';
    columns: (ColumnRefNode | WildcardNode | AliasedExpressionNode)[];
    from: FromSourceNode;
    joins: JoinNode[];
    where?: ExpressionNode;
    having?: ExpressionNode;
    orderBy?: OrderByItemNode[];
    limit?: number;
    offset?: number;
    distinct?: boolean;
    groupBy?: ColumnRefNode[];
    reorderFinal?: {
        direction: 'ASC' | 'DESC';
        expression?: ExpressionNode;
    };
    correlatedLookups?: CorrelatedLookupInfo[];
}
export interface UpdateAssignmentNode {
    type: 'UpdateAssignment';
    column: ColumnRefNode;
    value?: ExpressionNode;
    values?: ExpressionNode[];
    operator: 'set' | 'inc' | 'mul' | 'push' | 'pushEach' | 'unset';
    sign?: 1 | -1;
}
export interface ReturningClauseNode {
    type: 'ReturningClause';
    items: (ColumnRefNode | WildcardNode | AliasedExpressionNode)[];
}
export interface UpdateStatementNode {
    type: 'UpdateStatement';
    target: FromSourceNode;
    assignments: UpdateAssignmentNode[];
    where?: ExpressionNode;
    limit?: number;
    returning?: ReturningClauseNode;
}
export type TraversalStep = 'object' | 'array';
export interface ColumnRefNode {
    type: 'ColumnRef';
    name: string;
    alias?: string;
    traversal?: TraversalStep[];
    paramRef?: string;
}
export interface WildcardNode {
    type: 'Wildcard';
    source?: string;
}
export interface AliasedExpressionNode {
    type: 'AliasedExpression';
    expression: ExpressionNode;
    alias: string;
}
export interface FromSourceNode {
    type: 'FromSource';
    name: string;
    alias?: string;
}
export interface JoinNode {
    type: 'Join';
    joinType: 'INNER' | 'LEFT';
    source: FromSourceNode;
    on: ExpressionNode;
}
export interface OrderByItemNode {
    type: 'OrderByItem';
    expression: ExpressionNode;
    direction: 'ASC' | 'DESC';
}
export type ExpressionNode = BinaryOpNode | ColumnRefNode | LiteralNode | ParenExpressionNode | LikeExpressionNode | InExpressionNode | BetweenExpressionNode | UnaryOpNode | FunctionCallNode | ArithmeticOpNode | CaseExpressionNode | ExistsExpressionNode | ArrayExpressionNode | ScalarSubqueryNode;
export interface ArithmeticOpNode {
    type: 'ArithmeticOp';
    operator: string;
    left: ExpressionNode;
    right: ExpressionNode;
}
export interface CaseExpressionNode {
    type: 'CaseExpression';
    branches: {
        when: ExpressionNode;
        then: ExpressionNode;
    }[];
    else?: ExpressionNode;
}
export interface BinaryOpNode {
    type: 'BinaryOp';
    operator: string;
    left: ExpressionNode;
    right: ExpressionNode;
}
export interface UnaryOpNode {
    type: 'UnaryOp';
    operator: string;
    operand: ExpressionNode;
}
export interface LiteralNode {
    type: 'Literal';
    value: any;
}
export interface ParenExpressionNode {
    type: 'ParenExpression';
    expression: ExpressionNode;
}
export interface LikeExpressionNode {
    type: 'LikeExpression';
    value: ExpressionNode;
    pattern: ExpressionNode;
    not?: boolean;
}
export interface InExpressionNode {
    type: 'InExpression';
    left: ExpressionNode;
    values: ExpressionNode[];
    not?: boolean;
    subquerySql?: string;
    resolvedFromSubquery?: boolean;
    subqueryEmpty?: boolean;
    lookupAlias?: string;
    lookupValueField?: string;
}
export interface BetweenExpressionNode {
    type: 'BetweenExpression';
    value: ExpressionNode;
    lower: ExpressionNode;
    upper: ExpressionNode;
    not?: boolean;
}
export interface FunctionCallNode {
    type: 'FunctionCall';
    name: string;
    args: ExpressionNode[];
    wildcard?: boolean;
    distinct?: boolean;
}
export interface ExistsExpressionNode {
    type: 'ExistsExpression';
    subquerySql?: string;
    not?: boolean;
    resolved?: boolean;
    value?: boolean;
    lookupAlias?: string;
}
export interface ArrayExpressionNode {
    type: 'ArrayExpression';
    elements: ExpressionNode[];
}
export interface ScalarSubqueryNode {
    type: 'ScalarSubquery';
    subquerySql?: string;
    subqueryAst?: SelectStatementNode;
    lookupAlias?: string;
    valueField?: string;
    variables?: Record<string, any>;
    resolved?: boolean;
    resolvedValue?: any;
    processed?: boolean;
}
export type ASTNode = SelectStatementNode | UpdateStatementNode;
export type CorrelatedLookupInfo = {
    kind: 'exists';
    lookupAlias: string;
    variables: Record<string, any>;
    subquery: SelectStatementNode;
    node: ExistsExpressionNode;
    limit?: number;
} | {
    kind: 'in';
    lookupAlias: string;
    variables: Record<string, any>;
    subquery: SelectStatementNode;
    node: InExpressionNode;
    lookupValueField: string;
};
