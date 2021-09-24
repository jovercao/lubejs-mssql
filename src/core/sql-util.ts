import {
  SqlUtil,
  SqlOptions,
  DbType,
  Select,
  Parameter,
  Scalar,
  TableVariant,
  Insert,
  SQL,
  SQL_SYMBOLE_TABLE_MEMBER,
  Block,
  CreateIndex,
  AlterFunction,
  CreateFunction,
  AlterProcedure,
  AlterTable,
  CreateProcedure,
  AlterTableAddMember,
  CreateTableMember,
  CreateTable,
  ProcedureParameter,
  CreateSequence,
  DropSequence,
  Annotation,
  Break,
  Continue,
  If,
  While,
  Execute,
  AlterDatabase,
  CreateDatabase,
  DropDatabase,
  DropProcedure,
  DropFunction,
  DropIndex,
  CompatiableObjectName,
  ObjectName,
  Raw,
  ColumnDeclareForAlter,
  BinaryOperation,
  ColumnDeclareForAdd,
  PrimaryKey,
  UniqueKey,
  ForeignKey,
  CheckConstraint,
  isDbType,
  DbProvider,
  FunctionParameter,
  Assignment,
  BINARY_OPERATION_OPERATOR,
  Variant,
  PARAMETER_DIRECTION,
  Field,
} from 'lubejs/core';
import { dbTypeToRaw, rawToDbType } from './types';
import { sqlifyLiteral } from './util';

export type MssqlSqlOptions = SqlOptions;

/**
 * 默认编译选项
 */
export const DefaultSqlOptions: MssqlSqlOptions = {
  defaultSchema: 'dbo',

  strict: true,
  /**
   * 标识符引用，左
   */
  quotedLeft: '[',
  /**
   * 标识符引用，右
   */
  quotedRight: ']',

  /**
   * 参数前缀
   */
  parameterPrefix: '@',

  /**
   * 变量前缀
   */
  variantPrefix: '@',

  /**
   * 集合别名连接字符，默认为 ''
   */
  setsAliasJoinWith: 'AS',

  /**
   * 输出参数尾词
   */
  parameterOutWord: 'OUT',

  /**
   * 字段别名连接字符器，默认为 ''
   */
  fieldAliasJoinWith: 'AS',
};

export class MssqlSqlUtil extends SqlUtil {
  protected sqlifyDirection(direction: PARAMETER_DIRECTION): string {
    if (direction === 'IN') {
      return '';
    }

    return 'OUTPUT';
  }

  constructor(provider: DbProvider, options: MssqlSqlOptions | undefined) {
    super(provider, Object.assign({}, DefaultSqlOptions, options));
  }

  private parseQuotedName(name: string): string {
    if (
      name.startsWith(this.options.quotedLeft) &&
      name.endsWith(this.options.quotedRight)
    ) {
      return name.substr(1, name.length - 2);
    }
    return name.replace(this.escapeDotReg, '.');
  }

  private escapeDotReg = /(?<!\\)\./g;
  parseObjectName(name: CompatiableObjectName): ObjectName {
    if (typeof name === 'string') {
      // WARN: 此处可能会产生问题 [table.name] 这种写法将会产生错误解析.
      const [n, schema, database] = name.split(/(?<!\\)\./g).reverse();
      return {
        name: this.parseQuotedName(n),
        schema: schema && this.parseQuotedName(schema),
        database: database && this.parseQuotedName(database),
      };
    }
    return name;
  }

  protected sqlifyCreateDatabase(statement: CreateDatabase): string {
    let sql = `CREATE DATABASE ${this.sqlifyObjectName(statement.$name)}`;
    if (statement.$collate) {
      sql += ' COLLATE ' + statement.$collate;
    }
    return sql;
  }
  protected sqlifyAlterDatabase(statement: AlterDatabase): string {
    return `ALTER DATABASE ${this.sqlifyObjectName(statement.$name)} COLLATE ${
      statement.$collate
    }`;
  }
  protected sqlifyDropDatabase(statement: DropDatabase): string {
    return `DROP DATABASE ${this.sqlifyObjectName(statement.$name)}`;
  }
  protected sqlifyExecute(exec: Execute, params: Set<Parameter>): string {
    const returnParam = SQL.output(
      this.options.returnParameterName!,
      DbType.int32
    );
    return (
      'EXECUTE ' +
      this.sqlifyParameter(returnParam, params) +
      ' = ' +
      this.sqlifyIdentifier(exec.$proc) +
      ' ' +
      this.sqlifyExecuteArgumentList(exec.$args, params, exec)
    );
  }

  protected sqlifyBinaryOperation(
    exp: BinaryOperation,
    params?: Set<Parameter>
  ): string {
    if (exp.$operator === BINARY_OPERATION_OPERATOR.SHL) {
      return `${this.sqlifyExpression(
        exp.$left,
        params
      )} * POWER(2, ${this.sqlifyExpression(exp.$right, params)})`;
    }
    if (exp.$operator === BINARY_OPERATION_OPERATOR.SHR) {
      return `${this.sqlifyExpression(
        exp.$left,
        params
      )} / POWER(2, ${this.sqlifyExpression(exp.$right, params)})`;
    }
    if (exp.$operator === BINARY_OPERATION_OPERATOR.CONCAT) {
      return `${this.sqlifyExpression(exp.$left)} + ${this.sqlifyExpression(
        exp.$right
      )}`;
    }
    return super.sqlifyBinaryOperation(exp, params);
  }

  sqlifyContinue(statement: Continue): string {
    return 'CONTINUE';
  }
  sqlifyBreak(statement: Break): string {
    return 'BREAK';
  }
  sqlifyWhile(statement: While, params?: Set<Parameter>): string {
    this.assertAst(
      statement.$statement,
      'In while statement, do statement not found.'
    );
    let sql = `WHILE (${this.sqlifyCondition(statement.$condition)}) `;
    sql += this.sqlifyStatement(statement.$statement, params);
    return sql;
  }
  sqlifyIf(statement: If, params?: Set<Parameter>): string {
    this.assertAst(
      statement.$then,
      'In if statement, then statement not found.'
    );
    let sql = `IF (${this.sqlifyCondition(
      statement.$condition,
      params
    )})\n  ${this.sqlifyStatement(statement.$then, params)}\n  `;
    if (statement.$elseif && statement.$elseif.length > 0) {
      sql += statement.$elseif
        .map(([condition, statement]) => {
          this.assertAst(statement, 'In if statement, elseif then not found');
          return `ELSE IF (${this.sqlifyCondition(
            condition
          )}) ${this.sqlifyStatement(statement)}`;
        })
        .join('\n  ');
    }
    if (statement.$else) {
      sql += 'ELSE ';
      sql += this.sqlifyStatement(statement.$else);
    }
    return sql;
  }

  public joinBatchSql(...sqls: string[]): string {
    return sqls.join('\nGO\n');
  }

  protected sqlifyAnnotation(statement: Annotation): string {
    if (statement.$style === 'LINE') {
      return statement.$text
        .split(/\n|\r\n/g)
        .map((line) => '-- ' + line)
        .join('\n');
    }
    return (
      '/**\n' +
      statement.$text
        .split(/\n|\r\n/g)
        .map((line) => ' * ' + line.replace(/\*\//g, '* /'))
        .join('\n') +
      '\n */'
    );
  }

  public sqlifyLiteral(literal: Scalar | Raw): string {
    if (Raw.isRaw(literal)) {
      return literal.$sql;
    }
    return sqlifyLiteral(literal);
  }

  protected sqlifyDropSequence(statement: DropSequence): string {
    return `DROP SEQUENCE ${this.sqlifyObjectName(statement.$name)}`;
  }
  protected sqlifyCreateSequence(statement: CreateSequence): string {
    this.assertAst(
      statement.$dbType,
      'Sequence dbType not found, pls use `.as(dbType)` to set it.'
    );
    return `CREATE SEQUENCE ${this.sqlifyObjectName(
      statement.$name
    )} AS ${this.sqlifyType(statement.$dbType)} START WITH ${this.sqlifyLiteral(
      statement.$startValue.$value
    )} INCREMENT BY ${this.sqlifyLiteral(statement.$increment.$value)}`;
  }
  protected sqlifyProcedureParameter(param: ProcedureParameter): string {
    let sql = `${this.sqlifyVariantName(param.$name)} ${this.sqlifyType(
      param.$dbType
    )}`;
    if (param.$default) {
      sql += ' = ' + this.sqlifyLiteral(param.$default.$value);
    }
    sql += ' ' + this.sqlifyDirection(param.$direct);
    return sql;
  }

  protected sqlifyFunctionParameter(param: FunctionParameter): string {
    let sql = `${this.sqlifyVariantName(param.$name)} ${this.sqlifyType(
      param.$dbType
    )}`;
    if (param.$default) {
      sql += ' = ' + this.sqlifyLiteral(param.$default.$value);
    }
    return sql;
  }

  protected sqlifyBlock(
    statement: Block,
    params?: Set<Parameter>,
    parent?: SQL
  ): string {
    return `BEGIN\n  ${statement.$statements
      .map((statement) => this.sqlifyStatement(statement, params, parent))
      .join('\n  ')}\nEND`;
  }

  protected sqlifyDropIndex(index: DropIndex): string {
    return `DROP INDEX ${this.sqlifyObjectName(index.$table)}.${this.quoted(
      index.$name
    )}`;
  }

  protected sqlifyCreateIndex(statement: CreateIndex): string {
    let sql = 'CREATE ';
    if (statement.$unique) {
      sql += 'UNIQUE ';
    }
    if (statement.$clustered) {
      sql += 'CLUSTERED ';
    }
    this.assertAst(statement.$name, `Index name not found.`);
    this.assertAst(statement.$table, `Index on table not found.`);
    this.assertAst(statement.$columns, `Index columns not found.`);
    sql += `INDEX ${this.sqlifyObjectName(
      statement.$name
    )} ON ${this.sqlifyObjectName(statement.$table)}(${statement.$columns
      .map((col) => `${this.quoted(col.name)} ${col.sort}`)
      .join(', ')})`;
    return sql;
  }

  protected sqlifyDropFunction(statement: DropFunction): string {
    return `DROP FUNCTION ${this.sqlifyObjectName(statement.$name)}`;
  }

  protected sqlifyAlterFunction(statement: AlterFunction): string {
    // return `ALTER FUNCTION ${this.sqlifyObjectName(statement.$name)}(${
    //   statement.$params
    //     ? statement.$params
    //         .map((param) => this.sqlifyVariantDeclare(param))
    //         .join(', ')
    //     : ''
    // }) `;

    this.assertAst(
      statement.$body,
      'In AlterFunction statement, as statement not found.'
    );
    this.assertAst(
      statement.$returns,
      'In AlterFunction statement, returns type not found.'
    );
    return `ALTER FUNCTION ${this.sqlifyObjectName(statement.$name)}(${
      statement.$params
        ? statement.$params
            .map((param) => this.sqlifyFunctionParameter(param))
            .join(', ')
        : ''
    }) RETURNS ${
      Raw.isRaw(statement.$returns)
        ? statement.$returns.$sql
        : isDbType(statement.$returns)
        ? this.sqlifyType(statement.$returns)
        : TableVariant.isTableVariant(statement.$returns)
        ? this.sqlifyTableVariantDeclare(statement.$returns)
        : Variant.isVariant(statement.$returns)
        ? this.sqlifyVariantDeclare(statement.$returns)
        : this.sqlifyFunctionParameter(statement.$returns)
    } AS ${this.sqlifyStatement(statement.$body)}`;
  }

  protected sqlifyAssignment(
    assign: Assignment,
    params?: Set<Parameter<Scalar, string>>
  ): string {
    return 'SET ' + super.sqlifyAssignment(assign, params);
  }

  protected sqlifyCreateFunction(statement: CreateFunction): string {
    this.assertAst(
      statement.$body,
      'In CreateFunction statement, as statement not found.'
    );
    this.assertAst(
      statement.$returns,
      'In CreateFunction statement, returns type not found.'
    );
    return `CREATE FUNCTION ${this.sqlifyObjectName(statement.$name)}(${
      statement.$params
        ? statement.$params
            .map((param) => this.sqlifyFunctionParameter(param))
            .join(', ')
        : ''
    }) RETURNS ${
      Raw.isRaw(statement.$returns)
        ? statement.$returns.$sql
        : isDbType(statement.$returns)
        ? this.sqlifyType(statement.$returns)
        : TableVariant.isTableVariant(statement.$returns)
        ? this.sqlifyTableVariantDeclare(statement.$returns)
        : Variant.isVariant(statement.$returns)
        ? this.sqlifyVariantDeclare(statement.$returns)
        : this.sqlifyFunctionParameter(statement.$returns)
    } AS ${this.sqlifyStatement(statement.$body)}`;
  }

  protected sqlifyDropProcedure(statement: DropProcedure): string {
    return `DROP PROCEDURE ${this.sqlifyObjectName(statement.$name)}`;
  }

  protected sqlifyAlterProcedure(statement: AlterProcedure): string {
    this.assertAst(
      statement.$body,
      'AlterProcedure body statements not found, Pls use .as(...) assign it.'
    );
    return (
      `ALTER PROCEDURE ${this.sqlifyObjectName(statement.$name)} (${
        statement.$params
          ? statement.$params
              .map((param) => this.sqlifyProcedureParameter(param))
              .join(', ')
          : ''
      }) AS ` + this.sqlifyStatement(statement.$body)
    );
  }

  protected sqlifyCreateProcedure(statement: CreateProcedure): string {
    this.assertAst(
      statement.$body,
      'CreateProcedure body statements not found, Pls use .as(...) assign it.'
    );
    return (
      `CREATE PROCEDURE ${this.sqlifyObjectName(statement.$name)} (${
        statement.$params
          ? statement.$params
              .map((param) => this.sqlifyProcedureParameter(param))
              .join(', ')
          : ''
      }) AS ` + this.sqlifyStatement(statement.$body)
    );
  }

  protected sqlifyAlterTable(statement: AlterTable<string>): string {
    let sql = `ALTER TABLE ${this.sqlifyObjectName(statement.$name)}`;
    if (statement.$adds) {
      sql += ' ADD ';
      sql += statement.$adds
        .map((member) => this.sqlifyTableMember(member))
        .join(',\n  ');
    }
    if (statement.$drop) {
      sql += ' DROP ';
      if (statement.$drop.$kind === SQL_SYMBOLE_TABLE_MEMBER.COLUMN) {
        sql += ` COLUMN ${this.quoted(statement.$drop.$name)}`;
      } else {
        sql += ` CONSTRAINT ${this.quoted(statement.$drop.$name)}`;
      }
    }
    if (statement.$alterColumn) {
      sql += ` ALTER COLUMN ${this.quoted(
        statement.$alterColumn.$name
      )} ${this.sqlifyType(statement.$alterColumn.$dbType)} ${
        statement.$alterColumn.$nullable ? 'NULL' : 'NOT NULL'
      }`; // + this.sqlifyTableMember(statement.$alterColumn)
    }
    return sql;
  }

  private sqlifyTableMember(
    member: ColumnDeclareForAlter | AlterTableAddMember | CreateTableMember
  ) {
    if (ColumnDeclareForAlter.isColumnDeclareForAlter(member)) {
      let sql = `${this.quoted(member.$name)} ${this.sqlifyType(
        member.$dbType
      )}`;
      if (member.$nullable !== undefined) {
        sql += member.$nullable ? ' NULL' : ' NOT NULL';
      }
      return sql;
    }

    if (ColumnDeclareForAdd.isColumnDeclareForAdd(member)) {
      let sql = `${this.quoted(member.$name)} ${this.sqlifyType(
        member.$dbType
      )}`;
      if (member.$nullable !== undefined) {
        sql += member.$nullable ? ' NULL' : ' NOT NULL';
      }
      if (member.$identity) {
        sql += ` IDENTITY(${member.$identity.startValue}, ${member.$identity.increment})`;
      }
      if (member.$primaryKey) {
        sql += ' PRIMARY KEY';
        if (member.$primaryKey.nonclustered) {
          sql += ' NONCLUSTERED';
        }
      }
      if (member.$calculate) {
        sql += ` AS (${this.sqlifyExpression(member.$calculate)})`;
      }
      if (member.$default) {
        sql += ` DEFAULT (${this.sqlifyExpression(member.$default)})`;
      }
      if (member.$check) {
        sql += ` CHECK(${this.sqlifyCondition(member.$check)})`;
      }
      return sql;
    }
    if (PrimaryKey.isPrimaryKey(member)) {
      this.assertAst(member.$columns, 'Primary key columns not found.');
      return (
        (member.$name ? `CONSTRAINT ${this.quoted(member.$name)} ` : '') +
        ` PRIMARY KEY(${member.$columns.map(
          (col) => `${this.quoted(col.name)} ${col.sort}`
        )})`
      );
    }

    if (UniqueKey.isUniqueKey(member)) {
      this.assertAst(member.$columns, 'Unique key columns not found.');
      return (
        (member.$name ? `CONSTRAINT ${this.quoted(member.$name)} ` : '') +
        `UNIQUE(${member.$columns.map(
          (col) => `${this.quoted(col.name)} ${col.sort}`
        )})`
      );
    }

    if (ForeignKey.isForeignKey(member)) {
      this.assertAst(member.$columns, 'Foreign key columns not found.');
      this.assertAst(
        member.$referenceTable,
        'Foreign key reference table not found.'
      );
      this.assertAst(
        member.$referenceColumns,
        'Foreign key reference columns not found.'
      );
      return (
        (member.$name ? `CONSTRAINT ${this.quoted(member.$name)} ` : '') +
        `FOREIGN KEY(${member.$columns.map((col) =>
          this.quoted(col)
        )}) REFERENCES ${this.sqlifyObjectName(
          member.$referenceTable
        )}(${member.$referenceColumns
          .map((col) => this.quoted(col))
          .join(', ')})`
      );
    }

    if (CheckConstraint.isCheckConstraint(member)) {
      return (
        (member.$name ? `CONSTRAINT ${this.quoted(member.$name)} ` : '') +
        `CHECK (${this.sqlifyCondition(member.$sql)})`
      );
    }
  }

  sqlifyCreateTable(statement: CreateTable): string {
    this.assertAst(statement.$body, 'CreateTable statement name not found.');
    let sql = `CREATE TABLE ${this.sqlifyObjectName(statement.$name)} (`;
    sql += statement.$body
      .map((member) => this.sqlifyTableMember(member))
      .join(',\n  ');
    sql += ')';
    return sql;
  }

  protected sqlifyInsert(
    insert: Insert,
    params?: Set<Parameter>,
    parent?: SQL
  ): string {
    const sql = super.sqlifyInsert(insert, params, parent);
    if (!insert.$identityInsert) return sql;
    return `SET IDENTITY_INSERT ${this.sqlifyObjectName(insert.$table.$name)} ON
${sql}
SET IDENTITY_INSERT ${this.sqlifyObjectName(insert.$table.$name)} OFF
`;
  }

  protected sqlifyTableVariantDeclare(declare: TableVariant<any>): string {
    this.assertAst(declare.$name, 'Table Variant declare name not found.');
    this.assertAst(declare.$body, 'Table Variant declare members not found.');
    let sql = `${this.sqlifyVariantName(declare.$name)} TABLE(`;
    sql += declare.$body
      .map((member) => this.sqlifyTableMember(member))
      .join(',\n  ');
    sql += ')';
    return sql;
  }

  sqlifyType(type: DbType | Raw): string {
    if (Raw.isRaw(type)) {
      return type.$sql;
    }
    return dbTypeToRaw(type);
  }

  parseRawType(type: string): DbType {
    return rawToDbType(type);
  }

  protected sqlifyOffsetLimit(
    select: Select<any>,
    params: Set<Parameter>
  ): string {
    let sql = '';
    if (select.$offset === undefined && select.$limit === undefined) return sql;
    if (!select.$sorts) {
      select.orderBy(1);
      sql += ' ORDER BY 1';
    }
    sql += ` OFFSET ${select.$offset || 0} ROWS`;
    if (typeof select.$limit === 'number') {
      sql += ` FETCH NEXT ${select.$limit} ROWS ONLY`;
    }
    return sql;
  }
  // compileColumn(col, params) {
  //   return `${this.quoted(col.name)} = ${this.compileExpression(col.$expr, params, col)}`
  // }
}
