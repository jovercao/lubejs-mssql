import {
  CheckConstraintSchema,
  ColumnSchema,
  DatabaseSchema,
  ForeignKeySchema,
  IndexSchema,
  PrimaryKeySchema,
  TableSchema,
  // UniqueConstraintSchema,
  ViewSchema,
  ProcedureSchema,
  FunctionSchema,
  SequenceSchema,
  // SchemaSchema,
  LUBE_MIGRATE_TABLE_NAME,
  SchemaLoader,
  SQL,
  DbType,
  CompatiableObjectName,
  ObjectName,
} from 'lubejs';
import { database_principal_id } from '../core/build-in';
import { fullType } from './util';
import { MssqlConnection } from '../core/connection';

const {
  case: $case,
  select,
  table,
  and,
  std: { convert },
} = SQL;

const excludeTables: string[] = [LUBE_MIGRATE_TABLE_NAME];

type DatabaseObject = {
  id: number;
  database: string;
  name: string;
  schema: string;
  comment?: string;
};

export class MssqlSchemaLoader extends SchemaLoader {
  constructor(connection: MssqlConnection) {
    super(connection);
  }

  private currentDatabase?: string;

  private async changeDatabase(database: string): Promise<void> {
    if (!this.currentDatabase) {
      this.currentDatabase = await this.connection.getDatabaseName();
    }
    if (this.currentDatabase !== database) {
      await this.connection.changeDatabase(database);
      this.currentDatabase = database;
    }
  }

  private async _getTables(
    database: string,
    schema?: string,
    name?: string
  ): Promise<DatabaseObject[]> {
    await this.changeDatabase(database);
    const t = table({ name: 'tables', schema: 'sys' }).as('t');
    const p = table({ name: 'extended_properties', schema: 'sys' }).as('p');
    const s = table({ name: 'schemas', schema: 'sys' });
    const sql = select({
      id: t.object_id,
      name: t.name,
      schema: s.name,
      comment: p.value,
    })
      .from(t)
      .join(s, s.schema_id.eq(t.schema_id))
      .leftJoin(
        p,
        p.major_id
          .eq(t.object_id)
          .and(p.minor_id.eq(0))
          .and(p.class.eq(1))
          .and(p.name.eq('MS_Description'))
      )
      .where(and(t.type.eq('U'), t.name.notIn(...excludeTables)));
    if (schema) {
      sql.andWhere(s.name.eq(schema));
    }
    if (name) {
      sql.andWhere(t.name.eq(name));
    }
    return (await this.connection.query(sql)).rows.map((item) =>
      Object.assign(
        {
          database,
        },
        item
      )
    );
  }

  private async _fillTables(
    database: string,
    tables: Partial<TableSchema>[]
  ): Promise<TableSchema[]> {
    await this.changeDatabase(database);
    for (const table of tables) {
      const tableId = Reflect.get(table, 'id');
      Reflect.deleteProperty(table, 'id');
      table.columns = await this._getColumns(tableId);
      table.primaryKey = await this._getPrimaryKey(tableId);
      table.indexes = await this._getIndexes(tableId);
      table.constraints = [
        ...(await this._getCheckConstraints(tableId)),
        // ...(await this._getUniqueConstraints(tableId)),
      ];
      table.foreignKeys = await this._getForeignKeys(tableId);
    }
    return tables as TableSchema[];
  }

  async getTableNames(
    database: string,
    schema?: string
  ): Promise<Required<ObjectName>[]> {
    return await this._getTables(database, schema);
  }

  async getTables(database: string, schema?: string): Promise<TableSchema[]> {
    return await this._fillTables(
      database,
      await this._getTables(database, schema)
    );
  }

  async getTable(
    database: string,
    schema: string,
    name: string
  ): Promise<TableSchema> {
    const tables = await this._getTables(database, schema, name);
    return (await this._fillTables(database, tables))[0];
  }

  private async _getViews(
    database: string,
    schema?: string,
    name?: string
  ): Promise<DatabaseObject[]> {
    await this.changeDatabase(database);
    const v = SQL.table({ name: 'views', schema: 'sys' }).as('v');
    const p = SQL.table({ name: 'extended_properties', schema: 'sys' }).as('p');
    const s = SQL.table({ name: 'schemas', schema: 'sys' });
    const sql = SQL.select({
      id: v.object_id,
      name: v.name,
      schema: s.name,
      scripts: '',
      comment: p.value,
    })
      .from(v)
      .join(s, s.schema_id.eq(v.schema_id))
      .leftJoin(
        p,
        p.major_id
          .eq(v.object_id)
          .and(p.minor_id.eq(0))
          .and(p.class.eq(1))
          .and(p.name.eq('MS_Description'))
      )
      .where(and(v.type.eq('U'), v.name.notIn(...excludeTables)));
    if (schema) {
      sql.andWhere(s.name.eq(schema));
    }
    if (name) {
      sql.andWhere(v.name.eq(name));
    }
    return (await this.connection.query(sql)).rows.map((v) => ({
      database,
      ...v,
    }));
  }

  private async _fillViews(
    views: Partial<ViewSchema>[]
  ): Promise<ViewSchema[]> {
    for (const view of views) {
      view.scripts = await this._getCode(view.name!);
    }
    return views as ViewSchema[];
  }

  async getViewNames(
    database: string,
    schema: string
  ): Promise<Required<ObjectName>[]> {
    return await this._getViews(database, schema);
  }

  async getViews(database: string, schema?: string): Promise<ViewSchema[]> {
    const views = await this._getViews(database, schema);
    return await this._fillViews(views);
  }

  async getView(
    database: string,
    schema: string,
    name: string
  ): Promise<ViewSchema> {
    const views = await this._getViews(database, schema, name);
    return (await this._fillViews(views))[0];
  }

  private async _getCheckConstraints(
    tableId: number,
    name?: string
  ): Promise<CheckConstraintSchema[]> {
    const c = table({ name: 'check_constraints', schema: 'sys' }).as('c');
    const p = table({ name: 'extended_properties', schema: 'sys' }).as('p');
    const sql = select<CheckConstraintSchema>({
      kind: 'CHECK',
      name: c.name,
      comment: p.value,
      sql: c.definition,
    })
      .from(c)
      .join(
        p,
        and(
          p.class_desc.eq('OBJECT_OR_COLUMN'),
          p.major_id.eq(c.object_id),
          p.minor_id.eq(0)
        )
      )
      .where(
        and(c.parent_object_id.eq(tableId), c.type_desc.eq('CHECK_CONSTRAINT'))
      );
    if (name) {
      sql.andWhere(c.name.eq(name));
    }
    const { rows } = await this.connection.query(sql);
    return rows;
  }

  async getCheckConstraints(
    database: string,
    schema: string,
    table: string
  ): Promise<CheckConstraintSchema[]> {
    const tbs = await this._getTables(database, schema, table);
    if (tbs.length === 0) throw new Error(`Table ${table} not found.`);
    return await this._getCheckConstraints(tbs[0].id);
  }

  async getCheckConstraint(
    database: string,
    schema: string,
    table: string,
    constraint: string
  ): Promise<CheckConstraintSchema> {
    const tbs = await this._getTables(database, schema, table);
    if (tbs.length === 0) throw new Error(`Table ${table} not found.`);
    const result = (await this._getCheckConstraints(tbs[0].id, constraint))[0];
    if (!result) throw new Error(`CheckConstraint ${constraint} not found.`);
    return result;
  }

  private async _getColumns(
    tableId: number,
    name?: string
  ): Promise<ColumnSchema[]> {
    const c = table({ name: 'columns', schema: 'sys' }).as('c');
    const t = table({ name: 'types', schema: 'sys' }).as('t');
    const p = table({ name: 'extended_properties', schema: 'sys' }).as('p');
    const m = table({ name: 'default_constraints', schema: 'sys' }).as('m');
    const ic = table({ name: 'identity_columns', schema: 'sys' }).as('ic');
    const cc = table({ name: 'computed_columns', schema: 'sys' }).as('cc');

    const sql = select({
      name: c.name,
      isNullable: c.is_nullable,
      isIdentity: c.is_identity,
      identityStartValue: ic.seed_value.to(DbType.int32),
      identityIncrement: ic.increment_value.to(DbType.int32),
      isCalculate: c.is_computed,
      calculateExpression: cc.definition,
      // isTimestamp: convert($case().when(t.name.eq('timestamp'), 1).else(0), DbType.boolean),
      type_name: t.name,
      type_length: c.max_length,
      type_precision: c.precision,
      type_scale: c.scale,
      defaultValue: m.definition,
      comment: p.value,
    })
      .from(c)
      .leftJoin(
        ic,
        c.object_id.eq(ic.object_id).and(c.column_id.eq(ic.column_id))
      )
      .join(t, c.user_type_id.eq(t.user_type_id))
      .leftJoin(
        p,
        p.class
          .eq(1)
          .and(p.name.eq('MS_Description'))
          .and(p.major_id.eq(c.object_id))
          .and(p.minor_id.eq(c.column_id))
      )
      .leftJoin(m, m.object_id.eq(c.default_object_id))
      .leftJoin(
        cc,
        and(
          c.is_computed.eq(true),
          c.object_id.eq(cc.object_id),
          c.column_id.eq(cc.column_id)
        )
      )
      .where(c.object_id.eq(tableId));
    if (name) {
      sql.andWhere(c.name.eq(name));
    }
    const { rows } = await this.connection.query(sql);

    const columns: ColumnSchema[] = [];
    for (const row of rows) {
      const {
        defaultValue,
        type_name,
        type_length,
        type_precision,
        type_scale,
        ...datas
      } = row;
      const isRowflag = ['ROWVERSION', 'TIMESTAMP'].includes(
        (type_name as string).toUpperCase()
      );
      const column: ColumnSchema = {
        // 统一行标记类型
        type: isRowflag
          ? this.connection.sqlUtil.sqlifyType(DbType.rowflag)
          : fullType(type_name, type_length, type_precision, type_scale),
        isRowflag,
        defaultValue: defaultValue
          ? defaultValue.substr(1, defaultValue.length - 2)
          : null,
        ...datas,
      };
      columns.push(column);
    }
    return columns;
  }

  async getColumns(
    database: string,
    schema: string,
    table: string
  ): Promise<ColumnSchema[]> {
    const tbs = await this._getTables(database, schema, table);
    if (tbs.length === 0) throw new Error(`Table ${table} not found.`);
    return await this._getColumns(tbs[0].id);
  }

  async getColumn(
    database: string,
    schema: string,
    table: string,
    column: string
  ): Promise<ColumnSchema> {
    const tbs = await this._getTables(database, schema, table);
    if (tbs.length === 0) throw new Error(`Table ${table} not found.`);
    const result = (await this._getColumns(tbs[0].id, column))[0];
    if (!result) {
      throw new Error(`Column ${column} not found.`);
    }
    return result;
  }

  private async _getIndexes(
    tableId: number,
    name?: string
  ): Promise<IndexSchema[]> {
    const i = table({ name: 'indexes', schema: 'sys' }).as('i');
    const p = table({ name: 'extended_properties', schema: 'sys' }).as('p');

    const sql = select<IndexSchema>({
      name: i.name,
      isUnique: i.is_unique,
      isClustered: convert(
        $case(i.type).when(1, true).else(false),
        DbType.boolean
      ),
      comment: p.value,
    })
      .from(i)
      .leftJoin(
        p,
        and(
          p.class_desc.eq('INDEX'),
          p.major_id.eq(i.object_id),
          p.minor_id.eq(i.index_id)
        )
      )
      .where(
        and(
          i.object_id.eq(tableId),
          i.is_primary_key.eq(false),
          i.is_unique_constraint.eq(false),
          i.type.in(1, 2)
        )
      );
    if (name) {
      sql.andWhere(i.name.eq(name));
    }

    const { rows } = await this.connection.query(sql);
    const indexes: IndexSchema[] = rows.map(
      ({ name, isUnique, isClustered, comment }) =>
        ({
          name,
          isUnique,
          isClustered,
          comment,
        } as IndexSchema)
    );

    const ic = table({ name: 'index_columns', schema: 'sys' }).as('ic');
    // const ik = table('sysindexkeys').as('ik')
    const c = table({ name: 'columns', schema: 'sys' }).as('c');

    const colSql = select({
      indexName: i.name,
      name: c.name,
      isDesc: ic.is_descending_key,
    })
      .from(ic)
      .join(c, and(ic.object_id.eq(c.object_id), ic.column_id.eq(c.column_id)))
      .join(i, and(ic.object_id.eq(i.object_id), ic.index_id.eq(i.index_id)))
      .where(
        and(
          i.object_id.eq(tableId),
          i.is_primary_key.eq(false),
          i.is_unique_constraint.eq(false)
        )
      );
    const { rows: colRows } = await this.connection.query(colSql);
    for (const index of indexes) {
      index.columns = colRows
        .filter((p) => p.indexName === index.name)
        .map((p) => ({ name: p.name, isAscending: !p.isDesc }));
    }
    return indexes;
  }

  async getIndexes(
    database: string,
    schema: string,
    table: string
  ): Promise<IndexSchema[]> {
    const tbs = await this._getTables(database, schema, table);
    if (tbs.length === 0) throw new Error(`Table ${table} not found.`);
    return await this._getIndexes(tbs[0].id);
  }
  async getIndex(
    database: string,
    schema: string,
    table: string,
    index: string
  ): Promise<IndexSchema> {
    const tbs = await this._getTables(database, schema, table);
    if (tbs.length === 0) throw new Error(`Table ${table} not found.`);
    const result = (await this._getIndexes(tbs[0].id, index))[0];
    if (!result) {
      throw new Error(`Index ${index} not found.`);
    }
    return result;
  }
  private async _getForeignKeys(
    tableId?: number,
    refTableId?: number,
    name?: string
  ): Promise<ForeignKeySchema[]> {
    const fk = table({ name: 'foreign_keys', schema: 'sys' }).as('fk');
    const rt = table({ name: 'tables', schema: 'sys' }).as('rt');
    const d = table({ name: 'extended_properties', schema: 'sys' }).as('d');
    const s = table({ name: 'schemas', schema: 'sys' }).as('s');

    const sql = select({
      id: fk.object_id,
      name: fk.name,
      isCascade: fk.delete_referential_action.to(DbType.boolean),
      referenceTable: rt.name,
      referenceSchema: s.name,
      comment: d.value,
    })
      .from(fk)
      .join(rt, rt.object_id.eq(fk.referenced_object_id))
      .leftJoin(s, rt.schema_id.eq(s.schema_id))
      .leftJoin(
        d,
        d.name
          .eq('MS_Description')
          .and(d.major_id.eq(fk.object_id))
          .and(d.minor_id.eq(0))
      );
    if (tableId !== undefined) {
      sql.andWhere(fk.parent_object_id.eq(tableId));
    }
    if (refTableId !== undefined) {
      sql.andWhere(rt.object_id.eq(refTableId));
    }
    if (name) {
      sql.andWhere(fk.name.eq(name));
    }
    const foreignKeys: ForeignKeySchema[] = (await this.connection.query(sql))
      .rows as any;

    for (const foreignKey of foreignKeys) {
      const foreignKeyId = Reflect.get(foreignKey, 'id');
      Reflect.deleteProperty(foreignKey, 'id');
      const fkc = table({ name: 'foreign_key_columns', schema: 'sys' }).as(
        'fkc'
      );
      const fc = table({ name: 'columns', schema: 'sys' }).as('fc');
      const rc = table({ name: 'columns', schema: 'sys' }).as('rc');

      const colSql = select({
        fcolumn: fc.name,
        rcolumn: rc.name,
      })
        .from(fkc)
        .join(
          fc,
          fc.object_id
            .eq(fkc.parent_object_id)
            .and(fc.column_id.eq(fkc.parent_column_id))
        )
        .join(
          rc,
          rc.object_id
            .eq(fkc.referenced_object_id)
            .and(rc.column_id.eq(fkc.referenced_column_id))
        )
        .where(fkc.constraint_object_id.eq(foreignKeyId));
      const rows = (await this.connection.query(colSql)).rows!;
      foreignKey.columns = rows.map((p) => p.fcolumn);
      foreignKey.referenceColumns = rows.map((p) => p.rcolumn);
    }
    return foreignKeys;
  }

  async getForeignKeys(
    database: string,
    schema: string,
    table: string
  ): Promise<ForeignKeySchema[]> {
    const tbs = await this._getTables(database, schema, table);
    if (tbs.length === 0) throw new Error(`Table ${table} not found.`);
    return await this._getForeignKeys(tbs[0].id);
  }

  async getForeignKey(
    database: string,
    schema: string,
    table: string,
    fk: string
  ): Promise<ForeignKeySchema> {
    const tbs = await this._getTables(database, schema, table);
    if (tbs.length === 0) throw new Error(`Table ${table} not found.`);
    const result = (await this._getForeignKeys(tbs[0].id, undefined, fk))[0];
    if (!result) {
      throw new Error(`ForeignKey ${fk} not found.`);
    }
    return result;
  }

  async getReferenceKeys(
    database: string,
    schema: string,
    table: string
  ): Promise<ForeignKeySchema[]> {
    const tbs = await this._getTables(database, schema, table);
    if (tbs.length === 0) throw new Error(`Table ${table} not found.`);
    return await this._getForeignKeys(undefined, tbs[0].id);
  }

  private async _getPrimaryKey(tableId: number): Promise<PrimaryKeySchema> {
    const k = table({ name: 'key_constraints', schema: 'sys' }).as('k');
    const i = table({ name: 'indexes', schema: 'sys' }).as('i');
    const p = table({ name: 'extended_properties', schema: 'sys' }).as('p');

    const sql = select<PrimaryKeySchema>({
      name: k.name,
      isNonclustered: convert(
        $case(i.type).when(1, false).else(true),
        DbType.boolean
      ),
      comment: p.value,
    })
      .from(i)
      .join(k, and(i.object_id.eq(k.parent_object_id), k.type.eq('PK')))
      .leftJoin(
        p,
        and(p.class.eq(1), p.major_id.eq(k.object_id), p.minor_id.eq(0))
      )
      .where(and(i.object_id.eq(tableId), i.is_primary_key.eq(true)));
    const rows = (await this.connection.query(sql)).rows;
    const pk: PrimaryKeySchema = rows[0];

    if (pk) {
      const ic = table({ name: 'index_columns', schema: 'sys' }).as('ic');
      // const ik = table('sysindexkeys').as('ik')
      const c = table({ name: 'columns', schema: 'sys' }).as('c');

      const colSql = select({
        name: c.name,
        isDesc: ic.is_descending_key,
      })
        .from(ic)
        .join(
          c,
          and(ic.object_id.eq(c.object_id), ic.column_id.eq(c.column_id))
        )
        .join(i, and(ic.object_id.eq(i.object_id), ic.index_id.eq(i.index_id)))
        .where(and(i.object_id.eq(tableId), i.is_primary_key.eq(true)));

      const { rows: colRows } = await this.connection.query(colSql);
      pk.columns = colRows.map((p) => ({
        name: p.name,
        isAscending: !p.isDesc,
      }));
    }
    return pk;
  }

  async getPrimaryKey(
    database: string,
    schema: string,
    table: string
  ): Promise<PrimaryKeySchema> {
    const tbs = await this._getTables(database, schema, table);
    if (tbs.length === 0) throw new Error(`Table ${table} not found.`);
    return this._getPrimaryKey(tbs[0].id);
  }

  async getSchemaNames(database: string): Promise<string[]> {
    const p = table({ name: 'extended_properties', schema: 'sys' }).as('p');
    const s = table({ name: 'schemas', schema: 'sys' }).as('s');
    const sql = select({
      name: s.name,
      comment: p.value,
    })
      .from(s)
      .leftJoin(
        p,
        p.major_id
          .eq(s.schema_id)
          .and(p.class.eq(3))
          .and(p.minor_id.eq(0))
          .and(p.name.eq('MS_Description'))
      )
      .where(s.principal_id.eq(database_principal_id(database)));
    const result = (await this.connection.query(sql)).rows;
    // const schemas: SchemaSchema[] = result;
    return result.map((schema) => schema.name);
  }
  getDatabaseNames(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  private async _getFunctions(
    database: string,
    schema?: string,
    name?: string
  ): Promise<DatabaseObject[]> {
    await this.changeDatabase(database);
    const fn = table({ name: 'objects', schema: 'sys' }).as('fn');
    const p = table({ name: 'extended_properties', schema: 'sys' }).as('p');
    const s = table({ name: 'schemas', schema: 'sys' });
    const sql = select({
      id: fn.object_id,
      name: fn.name,
      schema: s.name,
      comment: p.value,
    })
      .from(fn)
      .join(s, s.schema_id.eq(fn.schema_id))
      .leftJoin(
        p,
        p.major_id
          .eq(fn.object_id)
          .and(p.minor_id.eq(0))
          .and(p.class.eq(1))
          .and(p.name.eq('MS_Description'))
      )
      .where(and(fn.type.eq('U'), fn.type.eq('FN')));
    if (schema) {
      sql.andWhere(s.name.eq(schema));
    }
    if (name) {
      sql.andWhere(fn.name.eq(name));
    }
    return (await this.connection.query(sql)).rows.map((f) => ({
      database,
      ...f,
    }));
  }

  private async _fillFunctions(
    functions: Partial<FunctionSchema>[]
  ): Promise<FunctionSchema[]> {
    for (const f of functions) {
      f.scripts = await this._getCode(f.name!);
    }
    return functions as FunctionSchema[];
  }

  async getFunctionNames(
    database: string,
    schema?: string
  ): Promise<Required<ObjectName>[]> {
    return this._getFunctions(database, schema);
  }

  async getFunctions(
    database: string,
    schema?: string
  ): Promise<FunctionSchema[]> {
    const functions = await this._getFunctions(database, schema);
    return await this._fillFunctions(functions);
  }

  async getFunctionSchema(
    database: string,
    schema: string,
    fn: string
  ): Promise<FunctionSchema> {
    const functions = await this._getFunctions(database, schema, fn);
    if (functions.length === 0) {
      throw new Error(`Function ${fn} not found.`);
    }
    return (await this._fillFunctions(functions))[0];
  }
  private async _getProcedures(
    database: string,
    schema?: string,
    name?: string
  ): Promise<DatabaseObject[]> {
    await this.changeDatabase(database);
    const proc = table({ name: 'procedures', schema: 'sys' }).as('proc');
    const p = table({ name: 'extended_properties', schema: 'sys' }).as('p');
    const s = table({ name: 'schemas', schema: 'sys' });
    const sql = select({
      id: proc.object_id,
      name: proc.name,
      schema: s.name,
      comment: p.value,
    })
      .from(proc)
      .join(s, s.schema_id.eq(proc.schema_id))
      .leftJoin(
        p,
        p.major_id
          .eq(proc.object_id)
          .and(p.minor_id.eq(0))
          .and(p.class.eq(1))
          .and(p.name.eq('MS_Description'))
      )
      .where(and(proc.type.eq('U'), proc.name.notIn(...excludeTables)));
    if (schema) {
      sql.andWhere(s.name.eq(schema));
    }
    if (name) {
      sql.andWhere(proc.name.eq(name));
    }
    return (await this.connection.query(sql)).rows.map((p) => ({
      database,
      ...p,
    }));
  }

  private async _fillProcedure(
    proces: Partial<ProcedureSchema>[]
  ): Promise<ProcedureSchema[]> {
    for (const procedure of proces) {
      procedure.scripts = await this._getCode(procedure.name!);
    }
    return proces as ProcedureSchema[];
  }

  getProcedureNames(
    database: string,
    schema?: string
  ): Promise<Required<ObjectName>[]> {
    return this._getProcedures(database, schema);
  }

  async getProcedures(
    database: string,
    schema?: string
  ): Promise<ProcedureSchema[]> {
    const proces = await this._getProcedures(database, schema);
    return await this._fillProcedure(proces);
  }

  async getProcedure(
    database: string,
    schema: string,
    proc: string
  ): Promise<ProcedureSchema> {
    const procedures = await this._getProcedures(database, schema, proc);
    if (procedures.length === 0) {
      throw new Error(`Procedure ${proc} not found.`);
    }
    return (await this._fillProcedure(procedures))[0];
  }

  async getDatabaseSchema(name: string): Promise<DatabaseSchema> {
    await this.changeDatabase(name);
    const d = table('sys.databases');
    const sql = select({
      name: d.name,
      collate: d.collation_name,
      comment: 'mssql not all comment to database.',
    })
      .from(d)
      .where(d.name.eq(name));
    const {
      rows: [row],
    } = await this.connection.query(sql);
    if (!row) {
      throw new Error(`Database ${name} not found.`);
    }

    const tables = await this.getTables(name);
    const views = await this.getViews(name);
    const procedures = await this.getProcedures(name);
    const functions = await this.getFunctions(name);
    const sequences = await this.getSequences(name);
    const schemas = await this.getSchemaNames(name);

    return {
      ...row,
      tables,
      views,
      procedures,
      functions,
      sequences,
      schemas,
    } as DatabaseSchema;
  }

  private async _getSequences(
    database: string,
    schema?: string,
    name?: string
  ): Promise<SequenceSchema[]> {
    await this.changeDatabase(database);
    const seq = table({ name: 'sequences', schema: 'sys' }).as('fn');
    const p = table({ name: 'extended_properties', schema: 'sys' }).as('p');
    const s = table({ name: 'schemas', schema: 'sys' });
    const t = table({ name: 'types', schema: 'sys' }).as('t');
    const sql = select({
      id: seq.object_id,
      name: seq.name,
      type_name: t.name,
      type_precision: seq.precision,
      type_scale: seq.scale,
      startValue: seq.start_value,
      increment: seq.increment,
      schema: s.name,
      scripts: '',
      comment: p.value,
    })
      .from(seq)
      .join(t, seq.user_type_id.eq(t.user_type_id))
      .join(s, s.schema_id.eq(seq.schema_id))
      .leftJoin(
        p,
        p.major_id
          .eq(seq.object_id)
          .and(p.minor_id.eq(0))
          .and(p.class.eq(1))
          .and(p.name.eq('MS_Description'))
      )
      .where(seq.type.eq('FN'));
    if (schema) sql.andWhere(s.name.eq(schema));
    if (name) sql.andWhere(seq.name.eq(name));
    const result = (await this.connection.query(sql)).rows;
    const functions: SequenceSchema[] = result.map((row) => {
      const { type_name, type_precision, type_scale, ...datas } = row;
      return {
        ...datas,
        type: fullType(type_name, 0, type_precision, type_scale),
      };
    });
    return functions;
  }

  getSequences(database: string, schema?: string): Promise<SequenceSchema[]> {
    return this._getSequences(database, schema);
  }
  async getSequence(
    database: string,
    schema: string,
    name: string
  ): Promise<SequenceSchema> {
    const seqs = await this._getSequences(database, schema, name);
    if (seqs.length === 0) throw new Error(`Sequence ${name} not found.`);
    return seqs[0];
  }

  private async _getCode(objname: string): Promise<string> {
    const rows = (
      await this.connection.execute<number, [{ Text: string }]>('sp_helptext', [
        objname,
      ])
    ).rows;
    const key = Object.keys(rows[0])[0];
    const code = rows.map((row) => Reflect.get(row, key)).join('\n');
    return code;
  }
}

// async function getUniqueConstraints(
//   tableId: number
// ): Promise<UniqueConstraintSchema[]> {
//   const i = table({ name: 'indexes', schema: 'sys' }).as('i');
//   const p = table({ name: 'extended_properties', schema: 'sys' }).as('p');
//   const k = table({ name: 'key_constraints', schema: 'sys' }).as('k');

//   const sql = select({
//     name: k.name,
//     indexName: i.name,
//     comment: p.value,
//   })
//     .from(i)
//     .join(
//       k,
//       and(i.object_id.eq(k.parent_object_id), k.unique_index_id.eq(i.index_id))
//     )
//     .leftJoin(
//       p,
//       and(p.class.eq(1), p.major_id.eq(k.object_id), p.minor_id.eq(0))
//     )
//     .where(and(i.is_unique.eq(false), i.object_id.eq(tableId)));
//   const { rows } = await connection.query(sql);
//   const uniques: UniqueConstraintSchema[] = rows.map((p) => ({
//     kind: 'UNIQUE',
//     name: p.name,
//     indexName: p.indexName,
//     comment: p.comment,
//     columns: [],
//   }));
//   const ic = table({ name: 'index_columns', schema: 'sys' }).as('ic');
//   // const ik = table('sysindexkeys').as('ik')
//   const c = table({ name: 'columns', schema: 'sys' }).as('c');

//   const colSql = select({
//     indexName: i.name,
//     name: c.name,
//     isDesc: ic.is_descending_key,
//   })
//     .from(ic)
//     .join(c, and(ic.object_id.eq(c.object_id), ic.column_id.eq(c.column_id)))
//     .join(i, and(ic.object_id.eq(i.object_id), ic.index_id.eq(i.index_id)))
//     .where(and(i.is_unique.eq(false), i.object_id.eq(tableId)));

//   const { rows: colRows } = await connection.query(colSql);
//   for (const unique of uniques) {
//     unique.columns = colRows
//       .filter((p) => p.indexName === Reflect.get(unique, 'indexName'))
//       .map((p) => ({ name: p.name, isAscending: !p.isDesc }));
//     Reflect.deleteProperty(unique, 'indexName');
//   }
//   return uniques;
// }
