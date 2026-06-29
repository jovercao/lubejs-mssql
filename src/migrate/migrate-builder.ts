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
} from 'lubejs';
import { sp_rename } from '../core/build-in';
import { formatSql } from '../core/util';
import { defaultGenerator } from 'snowflake-id-node';

const COMMENT_EXTEND_PROPERTY_NAME = 'MS_Description';

export class MssqlMigrateBuilder extends MigrateBuilder {
  constructor(provider: DbProvider) {
    super();
    this.sqlifier = provider.sqlifier;
  }

  throw(errmsg: XExpression<string>): ExecutableStatement {
    return SQL.raw(
      `RAISERROR(${typeof errmsg === 'string'
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
  alterColumn(
    table: XObjectName,
    buildColumn: (
      column: (name: string, type: DbType) => ColumnDeclareForAlter
    ) => ColumnDeclareForAlter
  ): ExecutableStatement | ExecutableStatement[] {
    const col = buildColumn(AlterTableBuilder.alter.column);
    const name = col.$name;
    const stmts: ExecutableStatement[] = [];
    const push = (s: ExecutableStatement | ExecutableStatement[]) => {
      if (Array.isArray(s)) stmts.push(...s);
      else stmts.push(s);
    };

    // 类型/可空：始终发 ALTER COLUMN（全量重声明，mssql 重设同类型幂等）
    const type = this.sqlifier.sqlifyType(col.$dbType);
    const nullability = col.$nullable ? 'NULL' : 'NOT NULL';
    push(
      SQL.raw(
        `ALTER TABLE ${this.sqlifier.sqlifyObjectName(
          table
        )} ALTER COLUMN ${this.sqlifier.quoted(name)} ${type} ${nullability}`
      )
    );

    // comment：setColumnComment 内部 IF EXISTS drop 再 add，upsert 安全
    if (col.$comment !== undefined) {
      push(this.setColumnComment(table, name, col.$comment ?? null));
    }

    // default：有值设、无值删；dropDefaultValue 内部 IF @ConstraintName IS NOT NULL 保护
    if (col.$default) {
      push(this.setDefaultValue(table, name, col.$default));
    } else {
      push(this.dropDefaultValue(table, name));
    }

    // identity 四态
    if (col.$identityAction === 'add') {
      // mssql 加 identity 需重建表，不支持自动（对齐 EF Core）
      push(
        SQL.annotation(
          '警告: mssql 加 identity 属性需重建表，暂不支持自动操作，请手动处理。',
          `操作信息： addIdentity(table: ${this.sqlifier.sqlifyObjectName(table)}, column: ${name})`
        )
      );
      push(
        SQL.raw(
          `RAISERROR ('警告: mssql 加 identity 属性需重建表，暂不支持自动操作，请手动处理。', 16, 1);`
        )
      );
    } else if (col.$identityAction === 'reseed') {
      // 种子变更：DBCC CHECKIDENT 自动、安全、幂等
      const seed = col.$identitySeed?.startValue ?? 1;
      push(
        SQL.raw(
          `DBCC CHECKIDENT (${this.sqlifier.sqlifyObjectName(table)}, RESEED, ${seed})`
        )
      );
    } else if (col.$identityAction === 'drop') {
      // mssql 去 identity 需侧迁列，不支持自动（对齐 EF Core）
      push(
        SQL.annotation(
          '警告: mssql 去 identity 属性需侧迁列，暂不支持自动操作，请手动处理。',
          `操作信息： dropIdentity(table: ${this.sqlifier.sqlifyObjectName(table)}, column: ${name})`
        )
      );
      push(
        SQL.raw(
          `RAISERROR ('警告: mssql 去 identity 属性需侧迁列，暂不支持自动操作，请手动处理。', 16, 1);`
        )
      );
    }
    // undefined: 不发 identity 语句

    // 计算列：维持"需重建表，发警告"语义
    if (col.$calculate) {
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

  private setDefaultValue(
    table: XObjectName<string>,
    column: string,
    defaultValue: XExpression<Scalar>
  ): ExecutableStatement {
    const noiceStr = defaultGenerator.generateSync();
    return SQL.raw(`
DECLARE @ConstaintName_${table} varchar(128);
SELECT @ConstaintName_${noiceStr} = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_column_id = c.column_id and dc.parent_object_id = c.object_id
WHERE c.object_id = object_id('${this.sqlifier.sqlifyObjectName(
      table
    )}') AND c.name = ${this.sqlifier.sqlifyLiteral(column)};
IF (@ConstaintName_${noiceStr} IS NOT NULL)
BEGIN
 EXEC ('ALTER TABLE ${this.sqlifier.sqlifyObjectName(
      table
    )} DROP CONSTRAINT ' + @ConstaintName_${noiceStr})
END

ALTER TABLE ${this.sqlifier.sqlifyObjectName(table)} ADD DEFAULT (${Expression.isExpression(defaultValue)
        ? this.sqlifier.sqlifyExpression(defaultValue)
        : defaultValue
      }) FOR ${this.sqlifier.quoted(column)}
`);
  }

  private dropDefaultValue(
    table: XObjectName<string>,
    column: string
  ): ExecutableStatement {
    const noiceStr = defaultGenerator.generateSync();
    return SQL.raw(`
DECLARE @ConstaintName_${noiceStr} varchar(128);
SELECT @ConstaintName_${noiceStr} = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
WHERE c.object_id = object_id('${this.sqlifier.sqlifyObjectName(
      table
    )}') and c.name = ${this.sqlifier.sqlifyLiteral(column)}
IF (@ConstaintNam_${noiceStr} IS NOT NULL)
BEGIN
  EXEC ('ALTER TABLE ${this.sqlifier.sqlifyObjectName(
      table
    )} DROP CONSTRAINT ' + @ConstaintName_${noiceStr})
END
`);
  }

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

  private setComment(name: XObjectName, type: 'TABLE' | 'VIEW' | 'SEQUENCE' | 'INDEX' | 'CONSTRAINT' | 'FUNCTION' | 'PROCEDURE',
    comment: string | null): ExecutableStatement {
    const schemaNoiceStr = defaultGenerator.generateSync();
    const nameNoiceStr = defaultGenerator.generateSync();
    const objectIdNoiceStr = defaultGenerator.generateSync();
    let sql = formatSql`
-- MigrateBuilder.setSequenceComment(${this.sqlifier.sqlifyObjectName(
      name
    )}, ${comment});
DECLARE @Schema_${schemaNoiceStr} VARCHAR(100), @Name_${nameNoiceStr} VARCHAR(100), @ObjectId_${objectIdNoiceStr} INT

SELECT @ObjectId = o.object_id, @Schema_${schemaNoiceStr} = s.name, @Name_${nameNoiceStr} = o.name
FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.object_id = object_id(${this.sqlifier.sqlifyObjectName(name)})

IF EXISTS(SELECT 1 FROM sys.extended_properties p WHERE p.major_id = @ObjectId_${objectIdNoiceStr} AND p.minor_id = 0 AND p.class = 1)
BEGIN
  EXEC sys.sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', @Schema_${schemaNoiceStr}, '${type}', @Name_${nameNoiceStr}
END
`;

    if (comment) {
      sql += formatSql`
EXEC sys.sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', @Schema_${schemaNoiceStr}, '${type}', @Name_${nameNoiceStr}`;
    }
    return SQL.raw(sql);
  }

  setProcedureComment(
    name: XObjectName,
    comment: string | null
  ): ExecutableStatement {
    return this.setComment(name, 'PROCEDURE', comment);
  }

  setFunctionComment(
    name: XObjectName,
    comment: string | null
  ): ExecutableStatement {
    return this.setComment(name, 'FUNCTION', comment);
  }

  setSequenceComment(
    name: XObjectName,
    comment: string | null
  ): ExecutableStatement {
    return this.setComment(name, 'SEQUENCE', comment);
  }

  setTableComment(
    name: XObjectName,
    comment: string | null
  ): ExecutableStatement {
    return this.setComment(name, 'TABLE', comment);
  }

  setViewComment(
    name: XObjectName,
    comment: string | null
  ): ExecutableStatement {
    return this.setComment(name, 'VIEW', comment);
  }
  setIndexComment(
    table: XObjectName,
    name: string,
    comment: string | null
  ): ExecutableStatement {
    return this.setComment(name, 'INDEX', comment);
  }

  setConstraintComment(
    table: XObjectName<string>,
    name: string,
    comment: string | null
  ): ExecutableStatement {
    return this.setComment(name, 'CONSTRAINT', comment);
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


  setColumnComment(
    table: XObjectName,
    name: string,
    comment: string | null
  ): ExecutableStatement {
    const schemaNoiceStr = defaultGenerator.generateSync();
    const tableNoiceStr = defaultGenerator.generateSync();
    const columnNoiceStr = defaultGenerator.generateSync();
    const objectIdNoiceStr = defaultGenerator.generateSync();
    let sql = formatSql`
-- MigrateBuilder.setColumnComment(${this.sqlifier.sqlifyObjectName(
      table
    )}, ${name}, ${comment});
DECLARE @Schema_${schemaNoiceStr} VARCHAR(100), @Table_${tableNoiceStr} VARCHAR(100), @ObjectId_${objectIdNoiceStr} INT, @Column_${columnNoiceStr} VARCHAR(100)

SET @Column_${columnNoiceStr} = ${name}

SELECT @ObjectId_${objectIdNoiceStr} = o.object_id, @Schema${schemaNoiceStr} = s.name, @Table_${tableNoiceStr} = o.name
FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.object_id = object_id(${this.sqlifier.sqlifyObjectName(table)})

IF EXISTS(SELECT 1
  FROM sys.extended_properties p INNER JOIN
  sys.columns c ON p.major_id = c.object_id AND p.minor_id = c.column_id
  WHERE c.object_id = @ObjectId_${objectIdNoiceStr} AND c.name = @Column_${columnNoiceStr} AND p.class = 1)
BEGIN
  EXEC sys.sp_dropextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, 'SCHEMA', @Schema${schemaNoiceStr}, 'TABLE', @Table_${tableNoiceStr}, 'COLUMN', @Column_${columnNoiceStr}
END
`;

    if (comment) {
      sql += formatSql`
EXEC sys.sp_addextendedproperty ${COMMENT_EXTEND_PROPERTY_NAME}, ${comment}, 'SCHEMA', @Schema${schemaNoiceStr}, 'TABLE', @Table_${tableNoiceStr}, 'COLUMN', @Column_${columnNoiceStr}`;
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
