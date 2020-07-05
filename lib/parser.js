const { Parser } = require('lubejs')

module.exports = class MssqlParser extends Parser {
  parseDate(date) {
    return `CONVERT(datetime, ${super.parseDate(date)})`
  }
}
