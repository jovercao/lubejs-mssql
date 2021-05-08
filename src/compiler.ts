import { Compiler, CompileOptions } from '../../lubejs'

export interface MssqlCompileOptions extends CompileOptions {

}

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

const TYPE_MAPPING = {
  string: 'NVARCHAR(MAX)',
  number: 'REAL(18)',
  date: 'DATETIMEOFFSET(7)',
  boolean: 'BIT',
  binary: 'IMAGE',
  bigint: 'BIGINT'
}

export class MssqlCompiler extends Compiler {
  constructor(options) {
    super(Object.assign({}, DefaultCompilerOptions, options))
  }

  compileDate(date) {
    const str = super.compileDate(date)
    return `CONVERT(DATETIMEOFFSET(7), ${str})`
  }

  compileConvert(convert, params, parent) {
    return `CONVERT(${TYPE_MAPPING[convert.$to]}, ${this.compileExpression(convert.$expr, params, convert)})`
  }

  // compileColumn(col, params) {
  //   return `${this.quoted(col.name)} = ${this.compileExpression(col.$expr, params, col)}`
  // }
}
