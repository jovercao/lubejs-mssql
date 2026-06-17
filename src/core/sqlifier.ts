import {
  Sqlifier,
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
  XObjectName,
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
  FunctionParameter,
  Assignment,
  BINARY_OPERATION_OPERATOR,
  Variant,
  PARAMETER_DIRECTION,
  Declare,
  Expression,
  Literal,
  CreateView,
  DropTable,
  DropView,
  CreateSchema,
  DropSchema,
  BuiltIn,
  Command,
  SqlCommand,
  QueryResult,
  Statement,
} from 'lubejs/core';
import { MssqlVirtualTranslator } from './virtual-translator';
import { sqlifyDbType, parseRawDbType, sqlifyLiteral } from './types';

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

export class MssqlSqlifier extends Sqlifier {
  protected sqlifyDirection(direction: PARAMETER_DIRECTION): string {
    if (direction === 'IN') {
      return '';
    }

    return 'OUTPUT';
  }

  readonly virtualTranslator = new MssqlVirtualTranslator(this);

  constructor(options: MssqlSqlOptions | undefined) {
    super(Object.assign({}, DefaultSqlOptions, options));
  }

  protected override sqlifyExecuteArgumentList(
    args: (BuiltIn | Expression<Scalar>)[],
    params?: Parameter[]
  ): string {
    return args
      .map((ast) => {
        // if (
        //   ScalarFuncInvoke.isScalarFuncInvoke(ast) ||
        //   (VirtualExpression.isVirtualExpression(ast) &&
        //     ast.$name === SQL.convert.name)
        // ) {
        //   throw new Error(
        //     `Mssql not allowed invoke/convert expression in store procedure execute arguments.`
        //   );
        // }
        // 存储过程参数中不能附带类型
        if (Literal.isLiteral(ast)) {
          // TIPS: 存储过程调用中，不允许出现类型转换及函数调用等
          return this.sqlifyLiteral(ast.$value);
        }
        if (BuiltIn.isBuiltIn(ast)) {
          return this.sqlifyBuildIn(ast);
        }
        let sql = this.sqlifyExpression(ast, params);
        if (Parameter.isParameter(ast)) {
          sql += ' ' + this.sqlifyDirection(ast.direction);
        }
        return sql;
      })
      .join(', ');
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
  parseObjectName(name: XObjectName): ObjectName {
    if (typeof name === 'string') {
      // WARN: 此处可能会产生问题 [table.name] 这种写法将会产生错误解析.
      const [n, schema] = name.split(/(?<!\\)\./g).reverse();
      return {
        name: this.parseQuotedName(n),
        schema: schema && this.parseQuotedName(schema),
        // database: database && this.parseQuotedName(database),
      };
    }
    return name;
  }

  protected sqlifyCreateSchema(statement: CreateSchema): SqlCommand {
    return {
      sql: `CREATE SCHEMA ${this.quoted(statement.$name)}`,
    };
  }
  protected sqlifyDropSchema(statement: DropSchema): SqlCommand {
    return {
      sql: `DROP SCHEMA ${this.quoted(statement.$name)}`,
    };
  }

  protected sqlifyDropTable(statement: DropTable): SqlCommand {
    let sql = '';
    const name = this.sqlifyObjectName(statement.$name);
    if (statement.$behavior === 'DROP_IF_EXISTS') {
      sql += `IF (OBJECT_ID(${this.sqlifyLiteral(name)}) IS NOT NULL) `;
    }
    sql += `DROP TABLE ${name}`;
    return {
      sql,
    };
  }

  protected sqlifyDropView(statement: DropView): SqlCommand {
    let sql = '';
    const name = this.sqlifyObjectName(statement.$name);
    if (statement.$behavior === 'DROP_IF_EXISTS') {
      sql += `IF (OBJECT_ID(${this.sqlifyLiteral(name)}) IS NOT NULL)\n`;
    }
    sql += `DROP VIEW ${name}`;
    return { sql };
  }

  protected sqlifyCreateDatabase(statement: CreateDatabase): SqlCommand {
    let sql = '';
    if (statement.$behavior === 'CREATE_IF_NOT_EXISTS') {
      sql += `IF (DB_ID(${this.sqlifyLiteral(statement.$name)}) IS NULL)\n`;
    }
    //  else if (statement.$behavior === 'CREATE_OR_REPLACE') {
    //   sql += `IF (db_id(${this.sqlifyLiteral(
    //     statement.$name
    //   )}) is not null) DROP DATABASE ${this.quoted(statement.$name)}\n`;
    // }
    sql += `CREATE DATABASE ${this.quoted(statement.$name)}`;
    if (statement.$collate) {
      sql += ' COLLATE ' + statement.$collate;
    }
    return { sql };
  }
  protected sqlifyAlterDatabase(statement: AlterDatabase): SqlCommand {
    return {
      sql: `ALTER DATABASE ${this.sqlifyObjectName(statement.$name)} COLLATE ${
        statement.$collate
      }`,
    };
  }
  protected sqlifyDropDatabase(statement: DropDatabase): SqlCommand {
    let sql = '';
    if (statement.$behavior === 'DROP_IF_EXISTS') {
      sql += `IF (DB_ID(${this.sqlifyLiteral(statement.$name)}) IS NOT NULL) `;
    }
    sql += `DROP DATABASE ${this.quoted(statement.$name)}`;
    return { sql };
  }
  protected override sqlifyExecute(exec: Execute): Command {
    const params: Parameter[] = [];
    const returnParam = SQL.output(
      this.options.returnParameterName!,
      DbType.int32
    );
    return {
      sql:
        'EXECUTE ' +
        this.sqlifyParameter(returnParam, params) +
        ' = ' +
        this.sqlifyIdentifier(exec.$proc) +
        ' ' +
        this.sqlifyExecuteArgumentList(exec.$args, params),
      params,
    };
  }

  protected override sqlifyBinaryOperation(
    exp: BinaryOperation,
    params?: Parameter[]
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
      return `${this.sqlifyExpression(
        exp.$left,
        params
      )} + ${this.sqlifyExpression(exp.$right, params)}`;
    }
    return super.sqlifyBinaryOperation(exp, params);
  }

  /**
   * 合并命令
   */
  mergeCommand(commands: Command[]): Command {
    // 如果包含非SQL命令，则单独执行
    if (commands.find((cmd) => typeof cmd === 'function')) {
      return async function (connection): Promise<QueryResult<any, any, any>> {
        const result = {
          rows: null as any,
          rowsAffected: 0,
          rowsets: [] as any[],
        };
        for (const cmd of commands) {
          const { rowsets, rowsAffected } = await connection.run(cmd);
          result.rowsAffected += rowsAffected;
          if (rowsets) {
            result.rowsets.push(...rowsets);
          }
        }
        result.rows = result.rowsets?.[0];
        return result as QueryResult<any, any, any>;
      };
    }
    const allParams = (commands as SqlCommand[])
      .filter((cmd) => cmd.params)
      .map((cmd) => cmd.params!)
      .flat();
    return {
      sql: (commands as SqlCommand[]).map((cmd) => cmd.sql).join('\n'),
      params: Array.from(new Set(allParams)),
    };
  }

  sqlifyContinue(statement: Continue): SqlCommand {
    return { sql: 'CONTINUE' };
  }
  sqlifyBreak(statement: Break): SqlCommand {
    return { sql: 'BREAK' };
  }
  assertSqlCommand(command: Command): asserts command is SqlCommand {
    if (typeof command === 'function') {
      throw new Error(`Program statement not support func statement command.`);
    }
  }
  sqlifyWhile(statement: While): SqlCommand {
    const params: Parameter[] = [];
    this.assertAst(
      statement.$statement,
      'In while statement, do statement not found.'
    );
    let sql = `WHILE (${this.sqlifyCondition(statement.$condition)}) \n`;
    const innerStatement = this.sqlifyStatement(statement.$statement);
    // this.assertSqlCommand(innerStatement);
    sql += innerStatement.sql;
    if (params && innerStatement.params) {
      params.push(...innerStatement.params);
    }
    return { sql, params: Array.from(new Set<Parameter>(params)) };
  }
  declare sqlifyStatement: (statement: Statement | Raw) => SqlCommand;

  sqlifyIf(statement: If): Command {
    const params: Parameter[] = [];
    this.assertAst(
      statement.$then,
      'In if statement, then statement not found.'
    );
    let sql = `IF (${this.sqlifyCondition(statement.$condition, params)})\n  ${
      this.sqlifyStatement(statement.$then).sql
    }\n  `;
    if (statement.$elseif && statement.$elseif.length > 0) {
      sql += statement.$elseif
        .map(([condition, statement]) => {
          this.assertAst(statement, 'In if statement, elseif then not found');
          const innerStatement = this.sqlifyStatement(statement);
          // this.assertSqlCommand(innerStatement);
          if (params && innerStatement.params) {
            params.push(...innerStatement.params);
          }
          return `ELSE IF (${this.sqlifyCondition(condition, params)}) ${
            innerStatement.sql
          }`;
        })
        .join('\n  ');
    }
    if (statement.$else) {
      this.assertAst(statement, 'In if statement, elseif then not found');
      const innerStatement = this.sqlifyStatement(statement.$else);
      // this.assertSqlCommand(innerStatement);
      sql += 'ELSE ';
      sql += innerStatement.sql;
      if (innerStatement.params) {
        params?.push(...innerStatement.params);
      }
    }
    return { sql, params };
  }

  public joinBatchSql(sqls: string[]): string {
    return sqls.join('\nGO\n');
  }

  protected sqlifyAnnotation(statement: Annotation): SqlCommand {
    let sql: string;
    if (statement.$style === 'LINE') {
      sql = statement.$text
        .split(/\n|\r\n/g)
        .map((line) => '-- ' + line)
        .join('\n');
    } else {
      sql =
        '/**\n' +
        statement.$text
          .split(/\n|\r\n/g)
          .map((line) => ' * ' + line.replace(/\*\//g, '* /'))
          .join('\n') +
        '\n */';
    }
    return { sql };
  }

  public sqlifyLiteral(literal: Scalar | Raw, dbType?: DbType): string {
    if (Raw.isRaw(literal)) {
      return literal.$sql;
    }
    return sqlifyLiteral(literal, dbType);
  }

  protected sqlifyDropSequence(statement: DropSequence): SqlCommand {
    let sql = '';
    const name = this.sqlifyObjectName(statement.$name);
    if (statement.$behavior === 'DROP_IF_EXISTS') {
      sql += `IF (OBJECT_ID(${this.sqlifyLiteral(name)}) IS NOT NULL) `;
    }
    sql += `DROP SEQUENCE ${name}`;
    return { sql };
  }
  protected sqlifyCreateSequence(statement: CreateSequence): SqlCommand {
    this.assertAst(
      statement.$dbType,
      'Sequence dbType not found, pls use `.as(dbType)` to set it.'
    );
    const sequenceName = this.sqlifyObjectName(statement.$name);
    let sql = '';
    if (statement.$behavior === 'CREATE_IF_NOT_EXISTS') {
      sql += `IF (OBJECT_ID(${this.sqlifyLiteral(sequenceName)}) IS NULL)\n`;
    }
    //  else if (statement.$behavior === 'CREATE_OR_REPLACE') {
    //   sql += `IF (OBJECT_ID(${this.sqlifyLiteral(
    //     sequenceName
    //   )}) is not null) DROP TABLE ${this.quoted(sequenceName)}\n`;
    // }
    sql += `CREATE SEQUENCE ${sequenceName} AS ${this.sqlifyType(
      statement.$dbType
    )} START WITH ${this.sqlifyLiteral(
      statement.$startValue.$value
    )} INCREMENT BY ${this.sqlifyLiteral(statement.$increment.$value)}`;
    return { sql };
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

  protected sqlifyProcedureParameters(params?: ProcedureParameter[]): string {
    if (!params || params.length === 0) return '';
    return `(${params
      .map((p) => this.sqlifyProcedureParameter(p))
      .join(', ')})`;
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

  protected sqlifyFunctionParameters(params?: FunctionParameter[]): string {
    if (!params || params.length === 0) return '';
    return `${params.map((p) => this.sqlifyFunctionParameter(p)).join(', ')}`;
  }

  protected sqlifyBlock(statement: Block): SqlCommand {
    let declare: SqlCommand;
    let sql: string = '';
    if (statement.$declares) {
      declare = this.sqlifyDeclare(statement.$declares);
      sql += declare.sql;
    }
    const innerStatement = this.mergeCommand(
      statement.$body.map((statement) => this.sqlifyStatement(statement))
    );
    this.assertSqlCommand(innerStatement);
    sql += `BEGIN\n  ${innerStatement.sql}\nEND`;
    return {
      sql,
      params: innerStatement.params,
    };
  }

  protected sqlifyDeclare(declare: Declare): SqlCommand {
    return {
      sql:
        'DECLARE ' +
        declare.$declares
          .map((dec) =>
            TableVariant.isTableVariant(dec)
              ? this.sqlifyTableVariantDeclare(dec)
              : this.sqlifyVariantDeclare(dec)
          )
          .join(', ') +
        '\n',
    };
  }

  protected sqlifyDropIndex(index: DropIndex): SqlCommand {
    return {
      sql: `DROP INDEX ${this.sqlifyObjectName(index.$table)}.${this.quoted(
        index.$name
      )}`,
    };
  }

  protected sqlifyCreateIndex(statement: CreateIndex): SqlCommand {
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
    return { sql };
  }

  protected sqlifyDropFunction(statement: DropFunction): SqlCommand {
    let sql = '';
    const name = this.sqlifyObjectName(statement.$name);
    if (statement.$behavior === 'DROP_IF_EXISTS') {
      sql += `IF (OBJECT_ID(${this.sqlifyLiteral(name)}) IS NOT NULL) `;
    }
    sql += `DROP FUNCTION ${name}`;
    return { sql };
  }

  protected sqlifyAlterFunction(statement: AlterFunction): SqlCommand {
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

    const sql = `ALTER FUNCTION ${this.sqlifyObjectName(
      statement.$name
    )}(${this.sqlifyFunctionParameters(statement.$params)}) RETURNS ${
      Raw.isRaw(statement.$returns)
        ? statement.$returns.$sql
        : isDbType(statement.$returns)
        ? this.sqlifyType(statement.$returns)
        : TableVariant.isTableVariant(statement.$returns)
        ? this.sqlifyTableVariantDeclare(statement.$returns)
        : Variant.isVariant(statement.$returns)
        ? this.sqlifyVariantDeclare(statement.$returns)
        : this.sqlifyFunctionParameter(statement.$returns)
    } AS
${this.sqlifyBlock(SQL.block(statement.$body)).sql}
`;
    return { sql };
  }

  protected override sqlifyAssignment(assign: Assignment): SqlCommand {
    const params: Parameter[] = [];
    return {
      sql: `SET ${this.sqlifyExpression(
        assign.left,
        params
      )} = ${this.sqlifyExpression(assign.right, params)}`,
      params,
    };
  }

  protected sqlifyCreateFunction(statement: CreateFunction): SqlCommand {
    this.assertAst(
      statement.$body,
      'In CreateFunction statement, as statement not found.'
    );
    this.assertAst(
      statement.$returns,
      'In CreateFunction statement, returns type not found.'
    );
    const fnName = this.sqlifyObjectName(statement.$name);
    let sql = '';
    if (statement.$behavior === 'CREATE_IF_NOT_EXISTS') {
      sql += `IF (OBJECT_ID(${this.sqlifyLiteral(fnName)}) IS NULL)\n`;
    }
    //  else if (statement.$behavior === 'CREATE_OR_REPLACE') {
    //   sql += `IF (OBJECT_ID(${this.sqlifyLiteral(
    //     fnName
    //   )}) is not null) DROP FUNCTION ${this.quoted(fnName)}\n`;
    // }
    sql += `CREATE FUNCTION ${fnName}(${this.sqlifyFunctionParameters(
      statement.$params
    )}) RETURNS ${
      Raw.isRaw(statement.$returns)
        ? statement.$returns.$sql
        : isDbType(statement.$returns)
        ? this.sqlifyType(statement.$returns)
        : TableVariant.isTableVariant(statement.$returns)
        ? this.sqlifyTableVariantDeclare(statement.$returns)
        : Variant.isVariant(statement.$returns)
        ? this.sqlifyVariantDeclare(statement.$returns)
        : this.sqlifyFunctionParameter(statement.$returns)
    } AS
${this.sqlifyBlock(SQL.block(statement.$body)).sql}
`;
    return { sql };
  }

  protected sqlifyDropProcedure(statement: DropProcedure): SqlCommand {
    let sql = '';
    const name = this.sqlifyObjectName(statement.$name);
    if (statement.$behavior === 'DROP_IF_EXISTS') {
      sql += `IF (OBJECT_ID(${this.sqlifyLiteral(name)}) IS NOT NULL) `;
    }
    sql += `DROP PROCEDURE ${name}`;
    return { sql };
  }

  protected sqlifyAlterProcedure(statement: AlterProcedure): SqlCommand {
    this.assertAst(
      statement.$body,
      'AlterProcedure body statements not found, Pls use .as(...) assign it.'
    );
    const sql = `ALTER PROCEDURE ${this.sqlifyObjectName(
      statement.$name
    )} ${this.sqlifyProcedureParameters(statement.$params)}
AS
${this.sqlifyBlock(SQL.block(statement.$body)).sql}
`;
    return { sql };
  }

  protected override sqlifyCreateView(
    statement: CreateView<any, string>
  ): SqlCommand {
    this.assertAst(
      statement.$body,
      'CreateView statement has no statements body.'
    );
    const viewName = this.sqlifyObjectName(statement.$name);
    let sql = '';
    if (statement.$behavior === 'CREATE_IF_NOT_EXISTS') {
      sql += `IF (OBJECT_ID(${this.sqlifyLiteral(viewName)}) IS NULL)\n`;
    }
    sql += `CREATE VIEW ${viewName} AS ${this.internalSqlifySelect(
      statement.$body
    )}`;
    return { sql };
  }

  protected sqlifyCreateProcedure(statement: CreateProcedure): SqlCommand {
    this.assertAst(
      statement.$body,
      'CreateProcedure body statements not found, Pls use .as(...) assign it.'
    );
    const procName = this.sqlifyObjectName(statement.$name);
    let sql = '';
    if (statement.$behavior === 'CREATE_IF_NOT_EXISTS') {
      sql += `IF (OBJECT_ID(${this.sqlifyLiteral(procName)}) IS NULL)\n`;
    }
    //  else if (statement.$behavior === 'CREATE_OR_REPLACE') {
    //   sql += `IF (OBJECT_ID(${this.sqlifyLiteral(
    //     procName
    //   )}) is not null) DROP PROCEDURE ${this.quoted(procName)}\n`;
    // }
    sql += `CREATE PROCEDURE ${procName} ${this.sqlifyProcedureParameters(
      statement.$params
    )}
AS
${this.sqlifyBlock(SQL.block(statement.$body)).sql}
`;
    return { sql };
  }

  protected sqlifyAlterTable(statement: AlterTable<string>): SqlCommand {
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
    return { sql };
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

  sqlifyCreateTable(statement: CreateTable): SqlCommand {
    this.assertAst(statement.$body, 'CreateTable statement name not found.');
    const tableName = this.sqlifyObjectName(statement.$name);
    let sql = '';
    if (statement.$behavior === 'CREATE_IF_NOT_EXISTS') {
      sql += `IF (OBJECT_ID(${this.sqlifyLiteral(tableName)}) IS NULL)\n`;
    }
    //  else if (statement.$behavior === 'CREATE_OR_REPLACE') {
    //   sql += `IF (OBJECT_ID(${this.sqlifyLiteral(
    //     tableName
    //   )}) is not null) DROP TABLE ${this.quoted(tableName)}\n`;
    // }
    sql += `CREATE TABLE ${tableName} (`;
    sql += statement.$body
      .map((member) => this.sqlifyTableMember(member))
      .join(',\n  ');
    sql += ')';
    return { sql };
  }

  protected override sqlifyInsert(insert: Insert): Command {
    const params: Parameter[] = [];
    const sql = this.internalSqlifyInsert(insert, params);
    if (!insert.$identityInsert)
      return {
        sql,
      };

    return {
      sql: `SET IDENTITY_INSERT ${this.sqlifyObjectName(insert.$table.$name)} ON
${sql}
SET IDENTITY_INSERT ${this.sqlifyObjectName(insert.$table.$name)} OFF
`,
    };
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
    return sqlifyDbType(type);
  }

  parseRawType(type: string): DbType {
    return parseRawDbType(type);
  }

  protected override sqlifyOffsetLimit(
    select: Select<any>,
    params?: Parameter[]
  ): string {
    let sql = '';
    if (select.$offset === undefined && select.$limit === undefined) return sql;
    if (!select.$sorts) {
      // select.orderBy(SQL.literal(1).asc());
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
