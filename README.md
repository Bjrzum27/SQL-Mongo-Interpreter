# sql-interpreter

[![npm version](https://img.shields.io/npm/v/sql-interpreter.svg?logo=npm)](https://www.npmjs.com/package/sql-interpreter)
[![Build](https://img.shields.io/badge/build-tsc-blue)](#pruebas-y-desarrollo-local)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Intérprete SQL para MongoDB: parsea sentencias SQL, genera pipelines de agregación y ejecuta consultas/updates manteniendo sintaxis familiar.

## Índice rápido

- [Descargas directas](#descargas-directas)
- [Publicación rápida en GitHub](#publicación-rápida-en-github)
- [Introducción](#introducción)
- [Características destacadas](#características-destacadas)
- [Instalación](#instalación)
- [Primeros pasos](#primeros-pasos)
- [Modelo de datos y convenciones](#modelo-de-datos-y-convenciones)
- [Cobertura de sintaxis](#cobertura-de-sintaxis)
- [Funciones integradas](#funciones-integradas)
- [Expresiones avanzadas y subconsultas](#expresiones-avanzadas-y-subconsultas)
- [UPDATE a pipeline de MongoDB](#update-a-pipeline-de-mongodb)
- [API pública](#api-pública)
- [Optimización y opciones](#optimización-y-opciones)
- [Integración con NestJS](#integración-con-nestjs)
- [Pruebas y desarrollo local](#pruebas-y-desarrollo-local)
- [Recetario práctico](#recetario-práctico)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Changelog resumido](#changelog-resumido)
- [Licencia](#licencia)

## Descargas directas

- 📦 **Paquete npm**: [sql-interpreter-0.2.3.tgz](./sql-interpreter-0.2.3.tgz)
  - Úsalo con `npm install ./sql-interpreter-0.2.3.tgz` para instalar la build empaquetada localmente.
- 💻 **Aplicación de escritorio**: [SQL.Mongo.Interpreter.Setup.1.0.0.exe](https://github.com/Bjrzum27/SQL-Mongo-Interpreter/releases/download/v1.0.0/SQL.Mongo.Interpreter.Setup.1.0.0.exe)
  - Descarga directa del ejecutable (101 MB) - No requiere instalación previa

## Introducción

`sql-interpreter` convierte instrucciones SQL (SELECT/UPDATE) en pipelines de agregación de MongoDB. Fue diseñado para escenarios donde se desea consultar Mongo como si fuera una base relacional, sin renunciar al poder de `$lookup`, `$group`, `$match` y operadores avanzados del ecosistema Mongo.

Internamente expone tres capas:

- **Parser** → genera un AST tipado a partir del SQL.
- **Compilador** → traduce el AST a etapas de agregación o actualizaciones pipeline (`updateMany`, `updateOne`).
- **Ejecutor** → orquesta ambas capas y ejecuta la consulta sobre una conexión “Mongo-like”.

Su API es agnóstica del framework, pero trae utilidades pensadas para integrarse fácilmente con NestJS y aplicaciones Node.js.

## Características destacadas

- SELECT complejo con `JOIN` (INNER/LEFT), `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT/OFFSET`, `TOP` y `DISTINCT`.
- Procesamiento de campos anidados con convenios `.value` / `.label` y operadores de *flatten* (`[]`, `{}`) sobre arreglos/objetos.
- Más de 30 funciones escalares: texto, numéricas, fechas, timezone, helpers de label/id, tamaño de arreglos, etc.
- Subconsultas: `IN (SELECT ...)`, `EXISTS`, subconsultas escalares y correlacionadas (con variables `LET`).
- `UPDATE` avanzado con operadores `=`, `+=`, `-=`, `*=`, `PUSH`, `PUSH EACH`, `UNSET`, cláusula `RETURNING` y soporte para subconsultas.
- Empuje automático de filtros (`WHERE pushdown`) para aprovechar índices antes de realizar `$lookup`.
- API de bajo nivel (`parseToAst`, `compileToAggregation`, `compileUpdate`) y ejecutor de alto nivel (`SqlExecutor`).

## Instalación

```powershell
npm install sql-interpreter
# o
yarn add sql-interpreter
```

Requiere Node.js ≥ 16. El paquete incluye el build ESM/CJS dentro de `dist/` y los tipos TypeScript.

## Primeros pasos

### 1. Crear un ejecutor

```ts
import { MongoClient } from 'mongodb';
import { SqlExecutor } from 'sql-interpreter';

const client = await MongoClient.connect(process.env.MONGO_URL!);
const db = client.db('analytics');

const executor = new SqlExecutor({
  collection: (name: string) => db.collection(name)
});
```

### 2. Ejecutar SQL como siempre

```ts
const sql = `
  SELECT u.nombre, SUM(o.total) AS total
  FROM usuarios u
  LEFT JOIN orders o ON o.user_id = u._id
  WHERE o.estado = 'PAGADO'
  GROUP BY u.nombre
  ORDER BY total DESC
  LIMIT 10
`;

const { ast, pipeline, data } = await executor.execute(sql, { debug: true });

console.dir(pipeline, { depth: null }); // pipeline listo para Mongo
console.table(data);                   // documentos devueltos por aggregate
```

### 3. Uso sin ejecutar (solo compilación)

```ts
import { parseToAst, compileToAggregation } from 'sql-interpreter';

const ast = parseToAst(sql);
const pipeline = compileToAggregation(ast, { limit: 50 });
await db.collection(ast.from.name).aggregate(pipeline).toArray();
```

## Modelo de datos y convenciones

### Documentos Mongo-like

El intérprete asume colecciones con documentos JSON. Cada identificador referencia `alias.campo` con rutas anidadas ilimitadas (`vehiculo.tipo.nombre`).

```json
{
  "_id": "veh-001",
  "cliente": { "value": "cli-123", "label": "Cliente Norte" },
  "ubicacion": { "value": "ubi-789", "label": "Sucursal Centro" },
  "tags": ["premium", "vip"],
  "sensores": [
    { "temperatura": 21, "alertas": [{ "code": "AL-01" }] },
    { "temperatura": 19, "alertas": [] }
  ]
}
```

### Convenio `.value` / `.label`

`campo.value` y `campo.label` caen a `$ifNull`: si el subcampo no existe, se usa el valor base. Ejemplo: `cliente.label` → `{$ifNull: ['$cliente.label', '$cliente']}`.

### Operadores de travesía

La sintaxis `[]` y `{}` permite recorrer arreglos u objetos:

- `tags[]` → aplana elementos de un arreglo (reduce arreglos anidados).
- `mediciones{}[]` → toma los valores de un objeto (`$objectToArray`) y después aplana arreglos.

Ejemplo:

```sql
SELECT u._id, SIZE(u.sensores[]) AS sensores_totales
FROM unidades u
WHERE 'vip' IN (u.tags[])
```

## Cobertura de sintaxis

### SELECT

- `SELECT columna`, `SELECT alias.columna AS nombre`, `SELECT *`, `SELECT alias.*`.
- Expresiones con alias implícito (`expr AS alias`) u omitido (se infiere `expr`).
- Error temprano si hay alias duplicados.

### FROM y JOIN

- `FROM coleccion [alias]`.
- `INNER JOIN` y `LEFT JOIN` con condición `ON alias.columna = alias2.columna`.
- Los JOIN se traducen a `$lookup` + `$unwind` inteligente (ajuste de `preserveNullAndEmptyArrays` en LEFT JOIN).

### WHERE

- `AND`, `OR`, `NOT`, paréntesis anidados.
- Comparaciones: `=`, `!=`, `<>`, `>`, `>=`, `<`, `<=`.
- Operadores especiales: `IN`, `NOT IN`, `BETWEEN`, `NOT BETWEEN`, `LIKE`, `NOT LIKE`.
- Manejo seguro de tipos: casteos implícitos, `onError/onNull` y fallback `.value/.label`.

### Agrupaciones

- `GROUP BY` obligatorio cuando se mezclan agregados con columnas planas.
- `HAVING` admite funciones agregadas, alias definidos en el SELECT y expresiones arbitrarias.
- `DISTINCT` se resuelve como `GROUP BY` implícito cuando no hay agregados.

### Orden, paginación y límites

- `ORDER BY expr [ASC|DESC]` (incluye funciones y expresiones complejas).
- `LIMIT` y `OFFSET` directos; `TOP n` se traduce automáticamente a `LIMIT n`.
- Ordenaciones auxiliares (`REORDER ASC|DESC`) disponibles para ajustar orden tras `LIMIT`.

## Funciones integradas

| Categoría | Funciones | Notas |
|-----------|-----------|-------|
| Texto / numéricas | `LOWER`, `UPPER`, `ABS`, `COALESCE`, `NULLIF`, `ROUND`, `FLOOR`, `CEIL`, `CEILING` | Operan con fallback a `null` cuando el valor no es convertible. |
| Fechas y zonas horarias | `NOW`, `TO_DATE`, `TO_LOCAL`, `TO_UTC`, `SHIFT_HOURS`, `START_OF_DAY`, `END_OF_DAY`, `DATE_ONLY_LOCAL`, `TIME_ONLY_LOCAL` | `offset` en horas; internamente usa `$dateAdd`, `$dateTrunc`, `$dateToString`. |
| Componentes de fecha | `YEAR`, `MONTH`, `DAY`, `HOUR`, `MINUTE`, `SECOND`, `MILLISECOND`, `ISO_WEEK`, `ISO_WEEK_YEAR`, `ISO_DAY_OF_WEEK`, `DATE_PART` | `DATE_PART` acepta alias (`'dom'`, `'doy'`, `'iso_week'`, etc.). |
| Diferencias y aritmética | `DATE_TRUNC`, `DATE_DIFF`/`DATEDIFF`, `DATE_ADD`, `DATE_SUB` | `DATE_TRUNC` admite `startOfWeek`. |
| Arrays | `SIZE(expr)` | Usa `$ifNull` + `$size`. Compatible con `expr[]`. |
| Convenios label/id | `LABEL(expr)`, `ID(expr)` | Fuerzan `.label`/`.value` con fallback. |

Funciones agregadas soportadas: `COUNT`, `COUNT(*)`, `COUNT(DISTINCT ...)`, `SUM`, `SUM(DISTINCT ...)`, `AVG`, `AVG(DISTINCT ...)`, `MIN`, `MAX`, `COUNT_IF(condición)`.

## Expresiones avanzadas y subconsultas

### CASE y aritmética

```sql
SELECT
  p.nombre,
  CASE
    WHEN p.score >= 900 THEN 'EXCELENTE'
    WHEN p.score BETWEEN 700 AND 899 THEN 'BUENO'
    ELSE 'EN RIESGO'
  END AS categoria,
  ROUND(p.monto / NULLIF(p.visitas, 0), 2) AS ticket_promedio
FROM perfiles p
```

### LIKE, IN y BETWEEN

- `LIKE` usa regex case-insensitive (`i`). `%` y `_` funcionan como comodines.
- `IN` admite literales o subconsultas (`IN (SELECT ...)`).
- `BETWEEN` realiza casteo a fecha si detecta literales compatibles.

### Subconsultas escalares

```sql
SELECT
  o._id,
  (SELECT u.email FROM users u WHERE u._id = o.user_id LIMIT 1) AS email
FROM orders o
```

La subconsulta se compila; si no es correlacionada se ejecuta en tiempo de compilación (optimización) para obtener el valor literal.

### Subconsultas correlacionadas (`IN` / `EXISTS`)

```sql
SELECT
  u._id,
  u.username
FROM users u
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.user_id = u._id
    AND o.total > 900
)
```

Para consultas correlacionadas el compilador genera `$lookup` con variables `let` e inserta `$match` dentro del pipeline hijo. También soporta `IN (SELECT ...)` correlacionado; el resultado se usa en `$in` sobre un arreglo construido dinámicamente.

## UPDATE a pipeline de MongoDB

La sentencia `UPDATE` mantiene sintaxis SQL y se traduce a un pipeline listo para `updateOne`/`updateMany`.

```sql
UPDATE orders o
SET total += ROUND(o.total * 0.05, 2),
        attempts += 1,
        lastChecked = NOW(),
        alerts PUSH 'audit'
WHERE o.status = 'PENDING'
RETURNING o._id, total AS nuevo_total, attempts;
```

Características:

- **Operadores**: `=` (`SET`), `+=`/`-=`, `*=`, `PUSH`, `PUSH EACH`, `UNSET`.
- **Subconsultas**: se permiten dentro de asignaciones (`SET campo = (SELECT ...)`) y se resuelven como *scalar lookups*.
- **RETURNING**: `RETURNING *` devuelve documentos completos; listar columnas aplica `$project` post-update con evaluador de fallback.
- **Limit 1**: habilita `updateOne` cuando la colección lo soporta.
- **Correlated updates**: cuando una asignación depende de otra colección, el ejecutor realiza `aggregate` previo y luego `update` por `_id`.

Resultado del compilador (`compileUpdate`):

```jsonc
{
  "filter": { "status": "PENDING" },
  "updatePipeline": [
    { "$set": { "total": { "$add": ["$total", { "$round": [{ "$multiply": ["$total", 0.05] }, 2] }] }, "attempts": { "$add": [{ "$ifNull": ["$attempts", 0] }, 1] }, "alerts": { "$concatArrays": [{ "$ifNull": ["$alerts", []] }, ['audit']] }, "lastChecked": "$$NOW" } }
  ],
  "limitOne": false,
  "setStage": { ... },
  "unsetFields": []
}
```

## API pública

```ts
import {
  parseToAst,
  compileToAggregation,
  compileUpdate,
  SqlExecutor,
  type CompileOptions,
  type CompiledUpdateResult,
  type SqlExecutorOptions,
  type MongoLikeConnection
} from 'sql-interpreter';
```

| Export | Descripción |
|--------|-------------|
| `parseToAst(sql)` | Devuelve `SelectStatementNode` o `UpdateStatementNode`. Valida duplicados, funciones y estructura. |
| `compileToAggregation(ast, options?)` | Genera un pipeline de agregación a partir del AST. `options.limit` fuerza un límite final. |
| `compileUpdate(ast, { scalarLookups? })` | Traduce un `UpdateStatementNode` a `{ filter, updatePipeline, limitOne, setStage, unsetFields }`. |
| `SqlExecutor` | Clase de conveniencia: `new SqlExecutor(connection)` y `execute(sql, options?)`. |
| `SqlExecutorOptions` | Extiende `CompileOptions` con `debug?: boolean`, `returnUpdatedDocs?: boolean`. |
| Tipos AST (`SelectStatementNode`, `ExpressionNode`, etc.) | Útiles para inspeccionar o construir transformaciones personalizadas. |

### Interface `MongoLikeConnection`

```ts
interface MongoLikeConnection {
  collection(name: string): {
    aggregate(pipeline: any[]): { toArray(): Promise<any[]> };
    updateMany(filter: any, update: any, options?: any): Promise<any>;
    updateOne?(filter: any, update: any, options?: any): Promise<any>;
  };
}
```

Puedes adaptar drivers como `mongoose.Connection`, `MongoClient.db`, Prisma (con adaptador) o incluso un mock en memoria para pruebas.

## Optimización y opciones

- **Pushdown de WHERE**: los predicados que solo tocan la tabla base se insertan antes de los `$lookup`, reduciendo el número de documentos que atraviesan los joins.
- **Split de HAVING**: partes de `HAVING` que solo dependen de la colección base se convierten en `$match` previo.
- **Ordenaciones inteligentes**: si `ORDER BY` usa expresiones, el compilador las convierte en `$addFields` temporales que luego elimina con `$unset`.
- **Correlated lookups**: para `EXISTS`/`IN` correlacionados, se generan `$lookup` dedicados cuyo resultado se elimina con `$unset` al final del pipeline.
- **Debug**: `executor.execute(sql, { debug: true })` imprime `pipeline`/`updatePipeline` en consola.

## Integración con NestJS

```ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SqlExecutor } from 'sql-interpreter';

@Injectable()
export class SqlInterpreterService {
  private readonly executor: SqlExecutor;

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.executor = new SqlExecutor({
      collection: (name: string) => this.connection.collection(name)
    });
  }

  execute(sql: string, options: SqlExecutorOptions = {}) {
    return this.executor.execute(sql, options);
  }
}
```

- Injecta `SqlInterpreterService` en tus controladores.
- Acepta SQL desde APIs REST/GraphQL y retorna `{ ast, pipeline, data }`.
- Personaliza límites globales con `options.limit` o aplica políticas de seguridad sobre el AST antes de compilar.

## Pruebas y desarrollo local

```powershell
npm install         # instala dependencias
npm run build       # genera dist/ y minifica
npm test            # compila y ejecuta consultas de ejemplo
```

`npm test` invoca `tests/run-tests.js`, que evalúa consultas almacenadas en `tests/*.query-interpreter` para verificar regresiones.

## Recetario práctico

### 1. Anti-join con EXISTS

```sql
SELECT u._id, u.username
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u._id AND o.estado = 'ANULADO'
)
```

### 2. KPIs por cliente y día

```sql
SELECT
  c.nombre AS cliente,
  FORMAT_LOCAL(TO_DATE(f.fecha), '%Y-%m-%d', -5) AS dia,
  COUNT(*) AS transacciones,
  SUM(f.monto) AS monto_total,
  AVG(f.monto) AS ticket_promedio
FROM facturas f
LEFT JOIN clientes c ON f.clienteId.value = c._id
WHERE TO_DATE(f.fecha) BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY c.nombre, FORMAT_LOCAL(TO_DATE(f.fecha), '%Y-%m-%d', -5)
ORDER BY dia DESC, transacciones DESC
```

### 3. Actualización con subconsulta escalar

```sql
UPDATE orders o
SET total = total + (SELECT impuestos FROM tarifas t WHERE t.categoria = o.categoria LIMIT 1)
WHERE o.estado = 'PENDING'
RETURNING o._id, total;
```

## Limitaciones conocidas

- Solo soporta `SELECT` y `UPDATE`. `INSERT`, `DELETE` y DDL están fuera de alcance por ahora.
- `JOIN` requiere condiciones de igualdad simples (`alias.col = alias2.col`). No hay soporte para joins múltiples por condición compuesta en una sola cláusula.
- `RETURNING alias.*` en `UPDATE` no está permitido actualmente.
- Las funciones personalizadas no se pueden registrar dinámicamente todavía.
- Si necesitas `arrayFilters` o `$pull`, habrá que ampliar el compilador (ver roadmap interno).

## Changelog resumido

- WHERE se aplica después de JOINs, permitiendo filtrar por campos del lado derecho.
- Comparaciones con `.label`/`.value` usan `$expr` con fallback y conversiones seguras.
- Revamped `COUNT_IF` y soporte para subconsultas correlacionadas en `IN`/`EXISTS` y `UPDATE`.

## Licencia

[MIT](LICENSE)
