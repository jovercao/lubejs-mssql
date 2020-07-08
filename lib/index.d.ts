import { Raw, ConnectOptions, IDbProvider, UnsureExpression, Invoke, Variant } from '../../lubejs/lib/lube'

/**
 * 连接数据库并返回含数据库连接池的Provider
 * @param config 连接选项
 */
export function connect(config: ConnectOptions): Promise<IDbProvider>

export default connect

type UnaryParameterInvoke = (expr: UnsureExpression) => Invoke
type NoneParameterInvoke = () => Invoke
type DatePart = Raw

/**
 * 系统函数
 */
export const FUNCTIONS: {
  count: UnaryParameterInvoke,
  avg: UnaryParameterInvoke,
  sum: UnaryParameterInvoke,
  max: UnaryParameterInvoke,
  min: UnaryParameterInvoke,
  exp: UnaryParameterInvoke,
  round: (expr: UnsureExpression, precision: UnsureExpression) => Invoke,
  nvl: UnaryParameterInvoke,
  stdev: UnaryParameterInvoke,
  dateName: UnaryParameterInvoke,
  datePart: UnaryParameterInvoke,
  isNull: (value: UnsureExpression, default_value: UnsureExpression) => Invoke,
  len: UnaryParameterInvoke,
  getDate: NoneParameterInvoke,
  getUtcDate: NoneParameterInvoke,
  date: NoneParameterInvoke,
  month: NoneParameterInvoke,
  year: NoneParameterInvoke,
  day: NoneParameterInvoke,
  dateAdd: (part: DatePart, increment: UnsureExpression, date: UnsureExpression) => Invoke,
  dateDiff: (part: DatePart, date: UnsureExpression, value: UnsureExpression) => Invoke,
  sysDateTime: NoneParameterInvoke,
  sysUtcDateTime: NoneParameterInvoke,
  charIndex: (pattern: UnsureExpression, str: UnsureExpression, startIndex?: UnsureExpression) => Invoke,
  left: UnaryParameterInvoke,
  right: UnaryParameterInvoke,
  str: UnaryParameterInvoke,
  substring: (expr: UnsureExpression, start: UnsureExpression, length: UnsureExpression) => Invoke,
  ascii: UnaryParameterInvoke,
  char: UnaryParameterInvoke,
  unicode: UnaryParameterInvoke,
  nchar: UnaryParameterInvoke,
  patIndex: (pattern: UnsureExpression, str: UnsureExpression) => Invoke,
  ltrim: UnaryParameterInvoke,
  rtrim: UnaryParameterInvoke,
  space: UnaryParameterInvoke,
  reverse: UnaryParameterInvoke,
  stuff: (expression_to_be_searched: UnsureExpression, starting_position: UnsureExpression, number_of_chars: UnsureExpression, replacement_expression: UnsureExpression) => Invoke,
  quotedName: UnaryParameterInvoke,
  lower: UnaryParameterInvoke,
  upper: UnaryParameterInvoke,
  replace: (expression_to_be_searched: UnsureExpression, search_expression: UnsureExpression, replacement_expression: UnsureExpression) => Invoke,
  abs: UnaryParameterInvoke,
  acos: UnaryParameterInvoke,
  asin: UnaryParameterInvoke,
  atan: UnaryParameterInvoke,
  atn2: UnaryParameterInvoke,
  ceiling: UnaryParameterInvoke,
  cos: UnaryParameterInvoke,
  cot: UnaryParameterInvoke,
  degrees: UnaryParameterInvoke,
  floor: UnaryParameterInvoke,
  log: UnaryParameterInvoke,
  log10: UnaryParameterInvoke,
  pi: UnaryParameterInvoke,
  power: UnaryParameterInvoke,
  radians: UnaryParameterInvoke,
  rand: UnaryParameterInvoke,
  sign: UnaryParameterInvoke,
  sin: UnaryParameterInvoke,
  sqrt: UnaryParameterInvoke,
  square: UnaryParameterInvoke,
  tan: UnaryParameterInvoke,
}

export const count: UnaryParameterInvoke
export const avg: UnaryParameterInvoke
export const sum: UnaryParameterInvoke
export const max: UnaryParameterInvoke
export const min: UnaryParameterInvoke
export const exp: UnaryParameterInvoke
export const round: (expr: UnsureExpression, precision: UnsureExpression) => Invoke
export const nvl: UnaryParameterInvoke
export const stdev: UnaryParameterInvoke
export const dateName: UnaryParameterInvoke
export const datePart: UnaryParameterInvoke
export const isNull: (value: UnsureExpression, default_value: UnsureExpression) => Invoke
export const len: UnaryParameterInvoke
export const getDate: NoneParameterInvoke
export const getUtcDate: NoneParameterInvoke
export const date: NoneParameterInvoke
export const month: NoneParameterInvoke
export const year: NoneParameterInvoke
export const day: NoneParameterInvoke
export const dateAdd: (part: DatePart, increment: UnsureExpression, date: UnsureExpression) => Invoke
export const dateDiff: (part: DatePart, date: UnsureExpression, value: UnsureExpression) => Invoke
export const sysDateTime: NoneParameterInvoke
export const sysUtcDateTime: NoneParameterInvoke
export const charIndex: (pattern: UnsureExpression, str: UnsureExpression, startIndex?: UnsureExpression) => Invoke
export const left: UnaryParameterInvoke
export const right: UnaryParameterInvoke
export const str: UnaryParameterInvoke
export const substring: (expr: UnsureExpression, start: UnsureExpression, length: UnsureExpression) => Invoke
export const ascii: UnaryParameterInvoke
export const char: UnaryParameterInvoke
export const unicode: UnaryParameterInvoke
export const nchar: UnaryParameterInvoke
export const patIndex: (pattern: UnsureExpression, str: UnsureExpression) => Invoke
export const ltrim: UnaryParameterInvoke
export const rtrim: UnaryParameterInvoke
export const space: UnaryParameterInvoke
export const reverse: UnaryParameterInvoke
export const stuff: (expression_to_be_searched: UnsureExpression, starting_position: UnsureExpression, number_of_chars: UnsureExpression, replacement_expression: UnsureExpression) => Invoke
export const quotedName: UnaryParameterInvoke
export const lower: UnaryParameterInvoke
export const upper: UnaryParameterInvoke
export const replace: (expression_to_be_searched: UnsureExpression, search_expression: UnsureExpression, replacement_expression: UnsureExpression) => Invoke
export const abs: UnaryParameterInvoke
export const acos: UnaryParameterInvoke
export const asin: UnaryParameterInvoke
export const atan: UnaryParameterInvoke
export const atn2: UnaryParameterInvoke
export const ceiling: UnaryParameterInvoke
export const cos: UnaryParameterInvoke
export const cot: UnaryParameterInvoke
export const degrees: UnaryParameterInvoke
export const floor: UnaryParameterInvoke
export const log: UnaryParameterInvoke
export const log10: UnaryParameterInvoke
export const pi: UnaryParameterInvoke
export const power: UnaryParameterInvoke
export const radians: UnaryParameterInvoke
export const rand: UnaryParameterInvoke
export const sign: UnaryParameterInvoke
export const sin: UnaryParameterInvoke
export const sqrt: UnaryParameterInvoke
export const square: UnaryParameterInvoke
export const tan: UnaryParameterInvoke

/**
 * 日期格式部分
 */
export const DATE_PART: {
  YEAR: DatePart,
  YY: DatePart,
  YYYY: DatePart,
  QUARTER: DatePart,
  QQ: DatePart,
  Q: DatePart,
  MONTH: DatePart,
  MM: DatePart,
  M: DatePart,
  DAYOFYEAR: DatePart,
  DY: DatePart,
  Y: DatePart,
  DAY: DatePart,
  DD: DatePart,
  D: DatePart,
  WEEK: DatePart,
  WK: DatePart,
  WW: DatePart,
  WEEKDAY: DatePart,
  DW: DatePart,
  HOUR: DatePart,
  HH: DatePart,
  MINUTE: DatePart,
  MI: DatePart,
  N: DatePart,
  SECOND: DatePart,
  SS: DatePart,
  S: DatePart,
  MILLISECOND: DatePart,
  MS: DatePart
}

export const YEAR: DatePart
export const YY: DatePart
export const YYYY: DatePart
export const QUARTER: DatePart
export const QQ: DatePart
export const Q: DatePart
export const MONTH: DatePart
export const MM: DatePart
export const M: DatePart
export const DAYOFYEAR: DatePart
export const DY: DatePart
export const Y: DatePart
export const DAY: DatePart
export const DD: DatePart
export const D: DatePart
export const WEEK: DatePart
export const WK: DatePart
export const WW: DatePart
export const WEEKDAY: DatePart
export const DW: DatePart
export const HOUR: DatePart
export const HH: DatePart
export const MINUTE: DatePart
export const MI: DatePart
export const N: DatePart
export const SECOND: DatePart
export const SS: DatePart
export const S: DatePart
export const MILLISECOND: DatePart
export const MS: DatePart

/**
 * 系统变量
 */
export const VARIANTS: {
  /**
   * 最后一次插入数据的标识列值
   */
  IDENTITY: Variant,
  /**
   * 最后一次执行受影响函数
   */
  ROWCOUNT: Variant,
  /**
   * 返回自上次启动 Microsoft SQL Server以来连接或试图连接的次数。
   */
  CONNECTIONS: Variant,
  /**
   * 返回自上次启动 Microsoft SQL Server以来 CPU 的工作时间，单位为毫秒（基于系统计时器的分辨率）。
   */
  CPU_BUSY: Variant,
  /**
   * 返回 SET DATEFIRST 参数的当前值，SET DATEFIRST 参数指明所规定的每周第一天：1 对应星期一，2 对应星期二，依次类推，用 7 对应星期日。
   */
  DATEFIRST: Variant,
  /**
   * 返回 Microsoft SQL Server自上次启动后用于执行输入和输出操作的时间，单位为毫秒（基于系统计时器的分辨率）。
   */
  IO_BUSY: Variant,
  /**
   * 返回当前所使用语言的本地语言标识符(ID)。
   */
  LANGID: Variant,
  /**
   * 返回当前使用的语言名。
   */
  LANGUAGE: Variant,
  /**
   * 返回 Microsoft SQL Server上允许的同时用户连接的最大数。返回的数不必为当前配置的数值。
   */
  MAX_CONNECTIONS: Variant,
  /**
   * 返回 Microsoft SQL Server自上次启动后从网络上读取的输入数据包数目。
   */
  PACK_RECEIVED: Variant,
  /**
   * 返回 Microsoft SQL Server自上次启动后写到网络上的输出数据包数目。
   */
  PACK_SENT: Variant,
  /**
   * 返回自 SQL Server 上次启动后，在 Microsoft SQL Server连接上发生的网络数据包错误数。
   */
  PACKET_ERRORS: Variant,
  /**
   * 返回运行 Microsoft SQL Server的本地服务器名称。
   */
  SERVERNAME: Variant,
  /**
   * 返回 Microsoft SQL Server正在其下运行的注册表键名。若当前实例为默认实例，则 @@SERVICENAME 返回 MSSQLServer；若当前实例是命名实例，则该函数返回实例名。
   */
  SERVICENAME: Variant,
  /**
   * 返回当前用户进程的服务器进程标识符 (ID)。
   */
  SPID: Variant,
  /**
   * 返回一刻度的微秒数。

   */
  TIMETICKS: Variant,
  /**
   * 返回 Microsoft SQL Server自上次启动后，所遇到的磁盘读/写错误数。
   */
  TOTAL_ERRORS: Variant,
  /**
   * 返回 Microsoft SQL Server自上次启动后写入磁盘的次数。
   */
  TOTAL_WRITE: Variant,
  /**
   * 返回 Microsoft SQL Server当前安装的日期、版本和处理器类型。
   */
  VERSION: Variant,
  /**
   * 返回 Microsoft SQL Server自上次启动后读取磁盘（不是读取高速缓存）的次数。
   */
  TOTAL_READ: Variant
}
