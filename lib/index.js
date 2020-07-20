const sql = require('mssql')
const { Provider } = require('./provider')
const { sysFn, raw, variant } = require('lubejs')

const defaultOptions = {
  server: 'localhost',
  // 端口号
  port: 1433,
  // 默认不启用加密
  encrypt: false,
  // 请求超时时间
  requestTimeout: 60000,
  // 连接超时时间
  connectionTimeout: 15000,
  // 开启JSON
  parseJSON: true,
  // 严格模式
  strict: true
}

const defaultPoolOptions = {
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000
}

module.exports = async function connect(config) {
  const options = Object.assign({}, defaultOptions, config)
  options.server = (config.host + (config.instance ? '\\' + config.instance : '')) || 'localhost',
  options.pool = Object.assign({}, defaultPoolOptions, {
    max: config.poolMax,
    min: config.poolMin,
    idleTimeoutMillis: config.idelTimeout
  })

  const pool = new sql.ConnectionPool(options)
  await pool.connect()
  return new Provider(pool, options)
}

module.exports.FUNCTIONS = {}

module.exports.connect = module.exports
module.exports.default = module.exports

const functions = [
  'count',
  'avg',
  'sum',
  'max',
  'min',
  'abs',
  'exp',
  'ceil',
  'round',
  'floor',
  'sqrt',
  'sine',
  'power',
  'nvl',
  'stdev',
  'square',
  'dateName',
  'datePart',
  'isNull',
  'len',
  'getDate',
  'getUtcDate',
  'date',
  'month',
  'year',
  'dateAdd',
  'dateDiff',
  'sysDateTime',
  'sysUtcDateTime',
  'charIndex',
  'left',
  'right',
  'str',
  'substring',
  'ascii',
  'char',
  'unicode',
  'nchar',
  'patIndex',
  'ltrim',
  'rtrim',
  'space',
  'reverse',
  'stuff',
  'quotedName',
  'lower',
  'upper',
  'replace',
  'rand',
  'abs',
  'acos',
  'asin',
  'atan',
  'atn2',
  'ceiling',
  'cos',
  'cot',
  'degrees',
  'exp',
  'floor',
  'log',
  'log10',
  'pi',
  'power',
  'radians',
  'rand',
  'round',
  'sign',
  'sin',
  'sqrt',
  'square',
  'tan'
]

functions.forEach(name => {
  module.exports.FUNCTIONS[name] = sysFn(name)
})

const dateParts = [
  'YEAR', 'YY', 'YYYY',
  'QUARTER', 'QQ', 'Q',
  'MONTH', 'MM', 'M',
  'DAYOFYEAR', 'DY', 'Y',
  'DAY', 'DD', 'D',
  'WEEK', 'WK', 'WW',
  'WEEKDAY', 'DW',
  'HOUR', 'HH',
  'MINUTE', 'MI', 'N',
  'SECOND', 'SS', 'S',
  'MILLISECOND', 'MS',
].map(name => name.toUpperCase())

module.exports.DATE_PART = {}

dateParts.forEach(name => {
  module.exports.DATE_PART[name] = raw(name)
})

const sysVariants = [
  'IDENTITY',
  'ROWCOUNT',
  'CONNECTIONS',
  'CPU_BUSY',
  'DATEFIRST',
  'IO_BUSY',
  'LANGID',
  'LANGUAGE',
  'MAX_CONNECTIONS',
  'PACK_RECEIVED',
  'PACK_SENT',
  'PACKET_ERRORS',
  'SERVERNAME',
  'SERVICENAME',
  'SPID',
  'TIMETICKS',
  'TOTAL_ERRORS',
  'TOTAL_WRITE',
  'VERSION',
  'TOTAL_READ'
]



module.exports.VARIANTS = {}

sysVariants.forEach(name => {
  module.exports.VARIANTS[name] = variant('@' + name)
})


Object.assign(module.exports, module.exports.FUNCTIONS)
Object.assign(module.exports, module.exports.DATE_PART)
Object.assign(module.exports, module.exports.VARIANTS)
