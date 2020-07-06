const { Parser, SQL_SYMBOLE } = require('lubejs')

module.exports = class MssqlParser extends Parser {
  parseDate(date) {
    return `CONVERT(datetime, ${super.parseDate(date)})`
  }

  parseParameter(param, params, parent) {
    let sql = super.parseParameter(param, params, parent)
    if (parent && parent.type === SQL_SYMBOLE.EXECUTE && p.direction === PARAMETER_DIRECTION.OUTPUT && this.ployfill.parameterOutWord) {
      sql += ' ' + this.ployfill.parameterOutWord
    }
    return sql
  }
}
