import { Compiler, CompileOptions, DbType, Select, Parameter, ConvertOperation, AST } from '../../lubejs/dist'

export interface MssqlCompileOptions extends CompileOptions {}

/**
 * 默认编译选项
 */
export const DefaultCompilerOptions: MssqlCompileOptions = {
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
  fieldAliasJoinWith: 'AS'
}

export class MssqlCompiler extends Compiler {
  constructor (options: MssqlCompileOptions) {
    super(Object.assign({}, DefaultCompilerOptions, options))
  }

  protected compileType (type: DbType): string {
    switch (type.name) {
      case 'STRING':
        return `VARCHAR(${type.length === 0 ? 'MAX' : type.length})`
      case 'INT8':
        return 'TINYINT'
      case 'INT16':
        return 'SMALLINT'
      case 'INT32':
        return 'INT'
      case 'INT64':
        return 'BIGINT'
      case 'BINARY':
        return `VARBINARY(${type.length === 0 ? 'MAX' : type.length})`
      case 'BOOLEAN':
        return 'BIT'
      case 'DATE':
        return 'DATE'
      case 'DATETIME':
        return 'DATETIMEOFFSET(7)'
      case 'FLOAT':
        return 'REAL'
      case 'DOUBLE':
        return 'FLOAT(53)'
      case 'NUMERIC':
        return `NUMERIC(${type.precision}, ${type.digit})`
      case 'UUID':
        return 'UNIQUEIDENTIFIER'
      case 'OBJECT':
      case 'LIST':
        return 'NVARCHAR(MAX)'
      case 'ROWFLAG':
        return 'TIMESTAMP'
      default:
        throw new Error(`Unsupport data type ${type['name']}`)
    }
  }

  compileDate (date: Date) {
    const str = super.compileDate(date)
    return `CONVERT(DATETIMEOFFSET(7), ${str})`
  }

  compileConvert (convert: ConvertOperation, params: Set<Parameter>, parent: AST): string {
    return `CONVERT(${this.compileType(convert.$to)}, ${this.compileExpression(
      convert.$expr,
      params,
      convert
    )})`
  }

  protected compileOffsetLimit(select: Select<any>, params: Set<Parameter>): string {
    let sql = ''
    if (select.$offset === undefined && select.$limit === undefined) return sql;
    if (!select.$sorts) {
      select.orderBy(1);
      sql += ' ORDER BY 1';
    }
    sql += ` OFFSET ${select.$offset || 0} ROWS`
    if (typeof select.$limit === 'number') {
      sql += ` FETCH NEXT ${select.$limit} ROWS ONLY`
    }
    return sql
  }
  // compileColumn(col, params) {
  //   return `${this.quoted(col.name)} = ${this.compileExpression(col.$expr, params, col)}`
  // }
}
