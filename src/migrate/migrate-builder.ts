import {
  MigrateBuilder,
  SQL,
  XExpression,
  Scalar,
  Condition,
  Sqlifier,
  DbType,
  XObjectName,
  DbProvider,
  Expression,
  ExecutableStatement,
  AlterTableBuilder,
  ColumnDeclareForAlter,
  ColumnChangeset,
} from 'lubejs';
import { sp_rename } from '../core/build-in';
import { formatSql } from '../core/util';

const COMMENT_EXTEND_PROPERTY_NAME = 'MS_Description';

export class MssqlMigrateBuilder extends MigrateBuilder {
  constructor(provider: DbProvider) {
    super();
    this.sqlifier = provider.sqlifier;
  }

  throw(errmsg: XExpression<string>): ExecutableStatement {
    return SQL.raw(
      `RAISERROR(${
        typeof errmsg === 'string'
          ? this.sqlifier.sqlifyLiteral(errmsg)
          : this.sqlifier.sqlifyExpression(errmsg)
      }, 10, 1)`
    );
  }

  renameSequence(name: XObjectName, newName: string): ExecutableStatement {
    return sp_rename(this.sqlifier.sqlifyObjectName(name), newName, 'OBJECT');
  }

  // renameDatabase(name: string, newName: string): ExecutableStatement {
  //   return SQL.raw(`
  //   USE master;
  //   ALTER DATABASE ${this.sqlifier.sqlifyObjectName(
  //     name
  //   )} SET SINGLE_USER WITH ROLLBACK IMMEDIAT
  //   ALTER DATABASE ${this.sqlifier.sqlifyObjectName(
  //     name
  //   )} MODIFY NAME = ${this.sqlifier.sqlifyObjectName(newName)} ;
  //   ALTER DATABASE ${this.sqlifier.sqlifyObjectName(newName)}  SET MULTI_USER`);
  // }

  // alterDatabase(name: string): AlterDatabase {
  //   return SQL.alterDatabase(name);
  // }
  // createDatabase(name: string): CreateDatabase {
  //   return SQL.createDatabase(name);
  // }
  // dropDatabase(name: string): DropDatabase {
  //   return SQL.dropDatabase(name);
  // }
  dropSchemaComment(name: string): ExecutableStatement {
    return this.setSchemaComment(name, null);
  }
  dropSequenceComment(name: XObjectName<string>): ExecutableStatement {
    return this.setSequenceComment(name, null);
  }
  dropProcedureComment(name: XObjectName<string>): ExecutableStatement {
    return this.setProcedureComment(name, null);
  }
  dropFunctionComment(name: XObjectName<string>): ExecutableStatement {
    return this.setFunctionComment(name, null);
  }
  dropTableComment(name: XObjectName<string>): ExecutableStatement {
    return this.setTableComment(name, null);
  }
  dropColumnComment(
    table: XObjectName<string>,
    name: string
  ): ExecutableStatement {
    return this.setColumnComment(table, name, null);
  }
  dropIndexComment(
    table: XObjectName<string>,
    name: string
  ): ExecutableStatement {
    return this.setIndexComment(table, name, null);
  }
  dropConstraintComment(
    table: XObjectName<string>,
    name: string
  ): ExecutableStatement {
    return this.setConstraintComment(table, name, null);
  }
  setAutoRowflag(
    table: XObjectName<string>,
    column: string
  ): ExecutableStatement[] {
    return [
      SQL.note(
        '=========================注意：MSSQL 自带行标记列类型，仅可通过修改类型来达成========================'
      ),
      SQL.alterTable(table).dropColumn(column),
      SQL.alterTable(table).add(({ column: c }) =>
        c(column, DbType.raw('TIMESTAMP'))
      ),
      // SQL.alterTable(table).alterColumn(c =>
      //   c(column, DbType.raw('ROWVERSION'))
      // )
    ];
  }
  dropAutoRowflag(
    table: XObjectName<string>,
    column: string
  ): ExecutableStatement[] {
    const tempColumn = '__' + column;
    return [
      SQL.note(
        '=========================MSSQL 自带标记列，仅通过修改类型来达成========================'
      ),
      SQL.alterTable(table).add(({ column: c }) =>
        c(tempColumn, DbType.binary(8)).notNull()
      ),
      SQL.update(table).set({
        [column]: SQL.field(column),
      }),
      SQL.alterTable(table).drop(({ column: c }) => c(column)),
      this.renameColumn(table, tempColumn, column),
    ];
  }

  /**
   * 统一列属性变更入口（mssql）。从变更集 changes 只发改动项：
   * - 类型/可空 → ALTER COLUMN（mssql 仅能改这两项）
   * - 注释 → 扩展属性（setColumnComment）
   * - 默认值 → 默认约束（setDefaultValue/dropDefaultValue）
   * - identity → 需重建表，发警告（setIdentity/dropIdentity）
   * - 计算列 → 需重建表，发警告
   * - rowflag → mssql TIMESTAMP 由 DB 自动维护，类型变更已由 changes.type 处理，不另发
   */
  alterColumn(
    table: XObjectName,
    buildColumn: (
      column: (name: string, type: DbType) => ColumnDeclareForAlter
    ) => ColumnDeclareForAlter,
    changes: ColumnChangeset
  ): ExecutableStatement | ExecutableStatement[] {
    const col = buildColumn(AlterTableBuilder.alter.column);
    const name = col.$name;
    const stmts: ExecutableStatement[] = [];
    const push = (s: ExecutableStatement | ExecutableStatement[]) => {
      if (Array.isArray(s)) stmts.push(...s);
      else stmts.push(s);
    };

    if (changes.type || changes.isNullable) {
      const type = this.sqlifier.sqlifyType(col.$dbType);
      const nullability = col.$nullable ? 'NULL' : 'NOT NULL';
      push(
        SQL.raw(
          `ALTER TABLE ${this.sqlifier.sqlifyObjectName(
            table
          )} ALTER COLUMN ${this.sqlifier.quoted(name)} ${type} ${nullability}`
        )
      );
    }

    if (changes.comment) {
      push(
        this.setColumnComment(table, name, changes.comment.source ?? null)
      );
    }

    if (changes.defaultValue) {
      if (changes.defaultValue.source) {
        push(
          this.setDefaultValue(
            table,
            name,
            SQL.raw(changes.defaultValue.source as string)
          )
        );
      } else {
        push(this.dropDefaultValue(table, name));
      }
    }

    if (
      changes.isIdentity ||
      changes.identityStartValue ||
      changes.identityIncrement
    ) {
      if (col.$identity) {
        push(
          this.setIdentity(
            table,
            name,
            col.$identity.startValue,
            col.$identity.increment
          )
        );
      } else {
        push(this.dropIdentity(table, name));
      }
    }

    if (changes.isCalculate || changes.calculateExpression) {
      push(
        SQL.annotation(
          '警告: mssql 计算列变更需重建表，暂不支持，请手动处理。'
        )
      );
    }

    return stmts;
  }

  // existsTable(name: CompatiableObjectName<string>): Expression<Scalar> {
  //   return
  // }
  private readonly sqlifier: Sqlifier;

  setDefaultValue(
    table: XObjectName<string>,
    column: string,
    defaultValue: XExpression<Scalar>
  ): ExecutableStatement {
    return SQL.raw(`
DECLARE @ConstaintName varchar(128);
SELECT @ConstaintName = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_column_id = c.column_id and dc.parent_object_id = c.object_id
WHERE c.object_id = object_id('${this.sqlifier.sqlifyObjectName(
      table
    )}') AND c.name = ${this.sqlifier.sqlifyLiteral(column)};
IF (@ConstaintName IS NOT NULL)
BEGIN
 EXEC ('ALTER TABLE ${this.sqlifier.sqlifyObjectName(
   table
 )} DROP CONSTRAINT ' + @ConstaintName)
END

ALTER TABLE ${this.sqlifier.sqlifyObjectName(table)} ADD DEFAULT (${
      Expression.isExpression(defaultValue)
        ? this.sqlifier.sqlifyExpression(defaultValue)
        : defaultValue
    }) FOR ${this.sqlifier.quoted(column)}
`);
  }

  dropDefaultValue(
    table: XObjectName<string>,
    column: string
  ): ExecutableStatement {
    return SQL.raw(`
DECLARE @ConstaintName varchar(128);
SELECT @ConstaintName = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
WHERE c.object_id = object_id('${this.sqlifier.sqlifyObjectName(
      table
    )}') and c.name = ${this.sqlifier.sqlifyLiteral(column)}
IF (@ConstaintName IS NOT NULL)
BEGIN
  EXEC ('ALTER TABLE ${this.sqlifier.sqlifyObjectName(
    table
  )} DROP CONSTRAINT ' + @ConstaintName)
END
`);
  }

  // setColumnType(table: CompatiableObjectName<string>, name: string, type: DbType): Statement {
  //   throw new Error('Method not implemented.')
  // }

  // /**
  //  * 复制一个新列及列的数据，以及除Identity以外的所有属性。
  //  * @param table
  //  * @param name
  //  * @param newName
  //  */
  // public async copyNewColumn(
  //   table: CompatiableObjectName,
  //   name: string,
  //   newName: string
  // ): Promise<Statement> {
  //   const result = SQL.block();
  //   const tableSchema = await load(
  //     this.provider,
  //     'TABLE',
  //     typeof table === 'string' ? table : table[0]
  //   );
  //   const columnSchema = tableSchema.columns.find(col => col.name === name);
  //   result.append(
  //     SQL.alterTable(table).add(builder =>
  //       builder.column(newName, SQL.raw(columnSchema.type)).null()
  //     )
  //   );
  //   const t = SQL.table(table);
  //   result.append(SQL.update(t).set(t[newName].assign(t[name])));
  //   if (!columnSchema.isNullable) {
  //     result.append(
  //       SQL.alterTable(table).alterColumn(column =>
  //         column(newName, SQL.raw(columnSchema.type)).notNull()
  //       )
  //     );
  //   }
  //   return result;
  // }

  addCheckConstaint(
    table: XObjectName<string>,
    sql: Condition,
    name?: string
  ): ExecutableStatement {
    return SQL.alterTable(table).add((builder) =>
      name ? builder.check(name, sql) : builder.check(sql)
    );
  }

  dropCheckConstaint(
    table: XObjectName<string>,
    name: string
  ): ExecutableStatement {
    return SQL.alterTable(table).drop((builder) => builder.check(name));
  }

  setIdentity(
    table: XObjectName<string>,
    column: string,
    startValue: number,
    increment: number
  ): ExecutableStatement[] {
    return [
      SQL.annotation(
        '警告: 由于mssql特性原因，setIdentity操作需要重建表，暂不支持identity属性变更，请手动处理，带来不便敬请谅解。',
        `操作信息： setIdentity(table: ${this.sqlifier.sqlifyObjectName(
          table
        )}, column: ${column}, startValue: ${startValue}, increment: ${increment})`
      ),
      SQL.raw(
        `RAISERROR ('警告: 由于mssql特性原因，setIdentity操作需要重建表，暂不支持identity属性变更，请手动处理，带来不便敬请谅解。', 16, 1);`
      ),
    ];
  }

  dropIdentity(
    table: XObjectName<string>,
    column: string
  ): ExecutableStatement[] {
    // const sql = this.copyNewColumn(table, column)
    return [
      SQL.annotation(
        '警告: 由于mssql特性原因，dropIdentity操作需要重建表，暂不支持identity属性变更，请手动处理，带来不便敬请谅解。',
        `操作信息： dropIdentity(table: ${this.sqlifier.sqlifyObjectName(
          table
        )}, column: ${column})`
      ),
      SQL.raw(
        `RAISERROR ('警告: 由于mssql特性原因，dropIdentity操作需要重建表，暂不支持identity属性变更，请手动处理，带来不便敬请谅解。', 16, 1);`
      ),
    ];
  }

  setProcedureComment(
    name: XObjectName,
    comment: string | null
  ): ExecutableStatement {
    let sql = formatSql`
-- MigrateBuilder.setProcedureComment(${this.sqlifier.sqlifyObjectName(
      name
    )}, ${comment});
DECLARE @Schema VARCHAR(100), @Proc VARCHAR(100), @ObjectId INT

SELECT @ObjectId = o.object_id, @Schema = s.name, @Proc = o.name
FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.object_id = object_id(${this.sqlifier.sqlifyObjectName(name)})

IF EXISTS(SELECT 1 FROM sys.extended_properties p WHERE p.major_id = @ObjectId AND p.minor_id = 0 AND p.class = 1)
BEGIN
  EXEC sys.sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', @Schema, 'PROCEDURE', @Proc
END
`;

    if (comment) {
      sql += formatSql`
EXEC sys.sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', @Schema, 'PROCEDURE', @Proc`;
    }
    return SQL.raw(sql);
  }

  setFunctionComment(
    name: XObjectName,
    comment: string | null
  ): ExecutableStatement {
    let sql = formatSql`
-- MigrateBuilder.setFunctionComment(${this.sqlifier.sqlifyObjectName(
      name
    )}, ${comment});
DECLARE @Schema VARCHAR(100), @Func VARCHAR(100), @ObjectId INT

SELECT @ObjectId = o.object_id, @Schema = s.name, @Func = o.name
FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.object_id = object_id(${this.sqlifier.sqlifyObjectName(name)})

IF EXISTS(SELECT 1 FROM sys.extended_properties p WHERE p.major_id = @ObjectId AND p.minor_id = 0 AND p.class = 1)
BEGIN
  EXEC sys.sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', @Schema, 'FUNCTION', @Func
END
`;

    if (comment) {
      sql += formatSql`
EXEC sys.sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', @Schema, 'FUNCTION', @Func`;
    }
    return SQL.raw(sql);
  }

  setSequenceComment(
    name: XObjectName,
    comment: string | null
  ): ExecutableStatement {
    let sql = formatSql`
-- MigrateBuilder.setSequenceComment(${this.sqlifier.sqlifyObjectName(
      name
    )}, ${comment});
DECLARE @Schema VARCHAR(100), @Sequence VARCHAR(100), @ObjectId INT

SELECT @ObjectId = o.object_id, @Schema = s.name, @Sequence = o.name
FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.object_id = object_id(${this.sqlifier.sqlifyObjectName(name)})

IF EXISTS(SELECT 1 FROM sys.extended_properties p WHERE p.major_id = @ObjectId AND p.minor_id = 0 AND p.class = 1)
BEGIN
  EXEC sys.sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', @Schema, 'SEQUENCE', @Sequence
END
`;

    if (comment) {
      sql += formatSql`
EXEC sys.sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', @Schema, 'SEQUENCE', @Sequence`;
    }
    return SQL.raw(sql);
  }

  setTableComment(
    name: XObjectName,
    comment: string | null
  ): ExecutableStatement {
    let sql = formatSql`
-- MigrateBuilder.setTableComment(${this.sqlifier.sqlifyObjectName(
      name
    )}, ${comment});
DECLARE @Schema VARCHAR(100), @Table VARCHAR(100), @ObjectId INT

SELECT @ObjectId = o.object_id, @Schema = s.name, @Table = o.name
FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.object_id = object_id(${this.sqlifier.sqlifyObjectName(name)})

IF EXISTS(SELECT 1 FROM sys.extended_properties p WHERE p.major_id = @ObjectId AND p.minor_id = 0 AND p.class = 1)
BEGIN
  EXEC sys.sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', @Schema, 'TABLE', @Table
END
`;

    if (comment) {
      sql += formatSql`
EXEC sys.sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', @Schema, 'TABLE', @Table`;
    }
    return SQL.raw(sql);
  }

  setViewComment(
    name: XObjectName,
    comment: string | null
  ): ExecutableStatement {
    let sql = formatSql`
-- MigrateBuilder.setViewComment(${this.sqlifier.sqlifyObjectName(
      name
    )}, ${comment});
DECLARE @Schema VARCHAR(100), @View VARCHAR(100), @ObjectId INT

SELECT @ObjectId = o.object_id, @Schema = s.name, @View = o.name
FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.object_id = object_id(${this.sqlifier.sqlifyObjectName(name)})

IF EXISTS(SELECT 1 FROM sys.extended_properties p WHERE p.major_id = @ObjectId AND p.minor_id = 0 AND p.class = 1)
BEGIN
  EXEC sys.sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', @Schema, 'VIEW', @View
END
`;

    if (comment) {
      sql += formatSql`
EXEC sys.sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', @Schema, 'VIEW', @View`;
    }
    return SQL.raw(sql);
  }

  setColumnComment(
    table: XObjectName,
    name: string,
    comment: string | null
  ): ExecutableStatement {
    let sql = formatSql`
-- MigrateBuilder.setColumnComment(${this.sqlifier.sqlifyObjectName(
      table
    )}, ${name}, ${comment});
DECLARE @Schema VARCHAR(100), @Table VARCHAR(100), @ObjectId INT, @Column VARCHAR(100)

SET @Column = ${name}

SELECT @ObjectId = o.object_id, @Schema = s.name, @Table = o.name
FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.object_id = object_id(${this.sqlifier.sqlifyObjectName(table)})

IF EXISTS(SELECT 1
  FROM sys.extended_properties p INNER JOIN
  sys.columns c ON p.major_id = c.object_id AND p.minor_id = c.column_id
  WHERE c.object_id = @ObjectId AND c.name = @Column AND p.class = 1)
BEGIN
  EXEC sys.sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', @Schema, 'TABLE', @Table, 'COLUMN', @Column
END
`;

    if (comment) {
      sql += formatSql`
EXEC sys.sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', @Schema, 'TABLE', @Table, 'COLUMN', @Column`;
    }
    return SQL.raw(sql);
  }

  setIndexComment(
    table: XObjectName,
    name: string,
    comment: string | null
  ): ExecutableStatement {
    let sql = formatSql`
-- MigrateBuilder.setIndexComment(${this.sqlifier.sqlifyObjectName(
      table
    )}, ${name}, ${comment});
DECLARE @Schema VARCHAR(100), @Table VARCHAR(100), @ObjectId INT, @Index VARCHAR(100)

SET @Index = ${name}

SELECT @ObjectId = o.object_id, @Schema = s.name, @Table = o.name
FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.object_id = object_id(${this.sqlifier.sqlifyObjectName(table)})

IF EXISTS(SELECT 1
  FROM sys.extended_properties p INNER JOIN
  sys.indexes i ON p.major_id = i.object_id AND p.minor_id = i.index_id
  WHERE i.object_id = @ObjectId AND i.name = @Index AND p.class = 1)
BEGIN
  EXEC sys.sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', @Schema, 'TABLE', @Table, 'INDEX', @Index
END
`;

    if (comment) {
      sql += formatSql`
EXEC sys.sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', @Schema, 'TABLE', @Table, 'INDEX', ${name}`;
    }
    return SQL.raw(sql);
  }

  setConstraintComment(
    table: XObjectName<string>,
    name: string,
    comment: string | null
  ): ExecutableStatement {
    let sql = formatSql`
-- MigrateBuilder.setConstraintComment(${this.sqlifier.sqlifyObjectName(
      table
    )}, ${name}, ${comment});
DECLARE @Schema VARCHAR(100), @Table VARCHAR(100), @ObjectId INT, @Constraint VARCHAR(100)

SET @Constraint = ${name}

SELECT @ObjectId = o.object_id, @Schema = s.name, @Table = o.name
FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.object_id = object_id(${this.sqlifier.sqlifyObjectName(table)})

IF EXISTS(
  SELECT 1
  FROM sys.extended_properties p INNER JOIN
  sys.check_constraints c ON p.major_id = c.object_id AND p.minor_id = 0
  WHERE c.parent_object_id = @ObjectId AND c.name = @Constraint AND p.class = 1
  UNION ALL
  SELECT 1
  FROM sys.extended_properties p INNER JOIN
  sys.default_constraints c ON p.major_id = c.object_id AND p.minor_id = 0
  WHERE c.parent_object_id = @ObjectId AND c.name = @Constraint AND p.class = 1
  UNION ALL
  SELECT 1
  FROM sys.extended_properties p INNER JOIN
  sys.key_constraints c ON p.major_id = c.object_id AND p.minor_id = 0
  WHERE c.parent_object_id = @ObjectId AND c.name = @Constraint AND p.class = 1
  UNION ALL
  SELECT 1
  FROM sys.extended_properties p INNER JOIN
  sys.foreign_keys c ON p.major_id = c.object_id AND p.minor_id = 0
  WHERE c.parent_object_id = @ObjectId AND c.name = @Constraint AND p.class = 1
)
BEGIN
  EXEC sys.sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', @Schema, 'TABLE', @Table, 'CONSTRAINT', @Constraint
END
`;

    if (comment) {
      sql += formatSql`
EXEC sys.sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', @Schema, 'TABLE', @Table, 'CONSTRAINT', @Constraint;
`;
    }
    return SQL.raw(sql);
  }

  setSchemaComment(name: string, comment: string | null): ExecutableStatement {
    let sql = formatSql`
-- MigrateBuilder.setSchemaComment(${this.sqlifier.sqlifyObjectName(
      name
    )}, ${comment});
IF EXISTS(
  SELECT 1 FROM sys.extended_properties p
  WHERE p.name = ${COMMENT_EXTEND_PROPERTY_NAME} AND p.major_id = SCHEMA_ID(${name}) AND p.class = 7 AND p.minor_id = 0
)
BEGIN
  EXEC sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', ${name};
END
`;
    if (comment) {
      sql += formatSql`
EXEC sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', ${name};`;
    }
    return SQL.raw(sql);
  }

  renameTable(name: XObjectName, newName: string): ExecutableStatement {
    return sp_rename(this.sqlifier.sqlifyObjectName(name), newName);
  }

  renameColumn(
    table: XObjectName,
    name: string,
    newName: string
  ): ExecutableStatement {
    return sp_rename(
      this.sqlifier.sqlifyObjectName(table) + '.' + this.sqlifier.quoted(name),
      newName,
      'COLUMN'
    );
  }

  renameView(name: XObjectName, newName: string): ExecutableStatement {
    return sp_rename(this.sqlifier.sqlifyObjectName(name), newName);
  }

  renameIndex(
    table: XObjectName,
    name: string,
    newName: string
  ): ExecutableStatement {
    return sp_rename(
      this.sqlifier.sqlifyObjectName(table) + '.' + this.sqlifier.quoted(name),
      newName,
      'INDEX'
    );
  }

  renameProcedure(name: XObjectName, newName: string): ExecutableStatement {
    return sp_rename(this.sqlifier.sqlifyObjectName(name), newName);
  }

  renameFunction(name: XObjectName, newName: string): ExecutableStatement {
    return sp_rename(this.sqlifier.sqlifyObjectName(name), newName);
  }
}
