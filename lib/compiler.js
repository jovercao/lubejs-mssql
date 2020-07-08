const { Compiler, SQL_SYMBOLE } = require('lubejs')


const DefaultCompilerOptions = {
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

module.exports = class MssqlCompiler extends Compiler {
  constructor(options) {
    super(Object.assign({}, DefaultCompilerOptions, options))
  }

  compileDate(date) {
    return `CONVERT(DATETIME, ${super.parseDate(date)})`
  }
}
