import { Raw, ConnectOptions, IDbProvider, Expressions, Invoke, Variant, JsConstant, Expression } from '../../lubejs/lib/lube';

/**
 * 连接数据库并返回含数据库连接池的Provider
 * @param config 连接选项
 */
export function connect(config: ConnectOptions): Promise<IDbProvider>;

export default connect;

type UnaryParameterInvoke<TResult extends JsConstant = JsConstant, TExpr = TResult> = (expr: Expressions<TExpr>) => Expression<TResult>;
type NoneParameterInvoke<T extends JsConstant> = () => Invoke<T>;
type DatePart = Raw;

/**
 * 系统函数
 */
export const FUNCTIONS: {
  count: UnaryParameterInvoke<any>,
  avg: UnaryParameterInvoke<number>,
  sum: UnaryParameterInvoke<number>,
  max: UnaryParameterInvoke<any>,
  min: UnaryParameterInvoke<any>,
  exp: UnaryParameterInvoke<number>,
  round: (expr: Expressions<number>, precision: Expressions<number>) => Expression<number>,
  nvl: UnaryParameterInvoke<any>,
  stdev: UnaryParameterInvoke<any>,
  dateName: UnaryParameterInvoke<string, Date>,
  datePart: UnaryParameterInvoke<number, Date>,
  isNull: <T extends Expressions>(value: Expressions, default_value: Expressions) => Expression<JsConstant>,
  len: UnaryParameterInvoke<number>,
  getDate: NoneParameterInvoke<Date>,
  getUtcDate: NoneParameterInvoke<Date>,
  date: NoneParameterInvoke<Date>,
  month: NoneParameterInvoke<number>,
  year: NoneParameterInvoke<number>,
  day: NoneParameterInvoke<number>,
  dateAdd: (part: DatePart, increment: Expressions<number>, date: Expressions<Date>) => Expression<Date>,
  dateDiff: (part: DatePart, startDate: Expressions<Date>, endDate: Expressions<Date>) => Expression<Date>,
  sysDateTime: NoneParameterInvoke<Date>,
  sysUtcDateTime: NoneParameterInvoke<Date>,
  charIndex: (pattern: Expressions<string>, str: Expressions<string>, startIndex?: Expressions<number>) => Expression<number>,
  left: (str: Expressions<string>, length: Expressions<number>) => Invoke<number>,
  right: (str: Expressions<string>, length: Expressions<number>) => Invoke<number>,
  str: UnaryParameterInvoke<string, any>,
  substring: (expr: Expressions<string>, start: Expressions<number>, length: Expressions<number>) => Expression<string>,
  ascii: UnaryParameterInvoke<number>,
  char: UnaryParameterInvoke<string, number>,
  unicode: UnaryParameterInvoke<number, string>,
  nchar: UnaryParameterInvoke<string, number>,
  patIndex: (pattern: Expressions<string>, str: Expressions<string>) => Expression<number>,
  ltrim: UnaryParameterInvoke<string>,
  rtrim: UnaryParameterInvoke<string>,
  space: UnaryParameterInvoke<string>,
  reverse: UnaryParameterInvoke<string>,
  stuff: (expression_to_be_searched: Expressions<string>, starting_position: Expressions<number>, number_of_chars: Expressions<number>, replacement_expression: Expressions<string>) => Invoke,
  quotedName: UnaryParameterInvoke<string>,
  lower: UnaryParameterInvoke<string>,
  upper: UnaryParameterInvoke<string>,
  replace: (expression_to_be_searched: Expressions<string>, search_expression: Expressions<string>, replacement_expression: Expressions<string>) => Invoke,
  abs: UnaryParameterInvoke<number>,
  acos: UnaryParameterInvoke<number>,
  asin: UnaryParameterInvoke<number>,
  atan: UnaryParameterInvoke<number>,
  atn2: UnaryParameterInvoke<number>,
  ceiling: UnaryParameterInvoke<number>,
  cos: UnaryParameterInvoke<number>,
  cot: UnaryParameterInvoke<number>,
  degrees: UnaryParameterInvoke<number>,
  floor: UnaryParameterInvoke<number>,
  log: UnaryParameterInvoke<number>,
  log10: UnaryParameterInvoke<number>,
  pi: UnaryParameterInvoke<number>,
  power: UnaryParameterInvoke<number>,
  radians: UnaryParameterInvoke<number>,
  rand: UnaryParameterInvoke<number>,
  sign: UnaryParameterInvoke<number>,
  sin: UnaryParameterInvoke<number>,
  sqrt: UnaryParameterInvoke<number>,
  square: UnaryParameterInvoke<number>,
  tan: UnaryParameterInvoke<number>,
};

export const count: UnaryParameterInvoke<any>;
export const avg: UnaryParameterInvoke<number>;
export const sum: UnaryParameterInvoke<number>;
export const max: UnaryParameterInvoke<any>;
export const min: UnaryParameterInvoke<any>;
export const exp: UnaryParameterInvoke<number>;
export const round: (expr: Expressions<number>, precision: Expressions<number>) => Expression<number>;
export const nvl: UnaryParameterInvoke<any>;
export const stdev: UnaryParameterInvoke<any>;
export const dateName: UnaryParameterInvoke<string, Date>;
export const datePart: UnaryParameterInvoke<number, Date>;
export const isNull: <T extends Expressions>(value: Expressions, default_value: Expressions) => Expression<JsConstant>;
export const len: UnaryParameterInvoke<number>;
export const getDate: NoneParameterInvoke<Date>;
export const getUtcDate: NoneParameterInvoke<Date>;
export const date: NoneParameterInvoke<Date>;
export const month: NoneParameterInvoke<number>;
export const year: NoneParameterInvoke<number>;
export const day: NoneParameterInvoke<number>;
export const dateAdd: (part: DatePart, increment: Expressions<number>, date: Expressions<Date>) => Expression<Date>;
export const dateDiff: (part: DatePart, startDate: Expressions<Date>, endDate: Expressions<Date>) => Expression<Date>;
export const sysDateTime: NoneParameterInvoke<Date>;
export const sysUtcDateTime: NoneParameterInvoke<Date>;
export const charIndex: (pattern: Expressions<string>, str: Expressions<string>, startIndex?: Expressions<number>) => Expression<number>;
export const left: (str: Expressions<string>, length: Expressions<number>) => Invoke<number>;
export const right: (str: Expressions<string>, length: Expressions<number>) => Invoke<number>;
export const str: UnaryParameterInvoke<string, any>;
export const substring: (expr: Expressions<string>, start: Expressions<number>, length: Expressions<number>) => Expression<string>;
export const ascii: UnaryParameterInvoke<number>;
export const char: UnaryParameterInvoke<string, number>;
export const unicode: UnaryParameterInvoke<number, string>;
export const nchar: UnaryParameterInvoke<string, number>;
export const patIndex: (pattern: Expressions<string>, str: Expressions<string>) => Expression<number>;
export const ltrim: UnaryParameterInvoke<string>;
export const rtrim: UnaryParameterInvoke<string>;
export const space: UnaryParameterInvoke<string>;
export const reverse: UnaryParameterInvoke<string>;
export const stuff: (expression_to_be_searched: Expressions<string>, starting_position: Expressions<number>, number_of_chars: Expressions<number>, replacement_expression: Expressions<string>) => Invoke;
export const quotedName: UnaryParameterInvoke<string>;
export const lower: UnaryParameterInvoke<string>;
export const upper: UnaryParameterInvoke<string>;
export const replace: (expression_to_be_searched: Expressions<string>, search_expression: Expressions<string>, replacement_expression: Expressions<string>) => Invoke;
export const abs: UnaryParameterInvoke<number>;
export const acos: UnaryParameterInvoke<number>;
export const asin: UnaryParameterInvoke<number>;
export const atan: UnaryParameterInvoke<number>;
export const atn2: UnaryParameterInvoke<number>;
export const ceiling: UnaryParameterInvoke<number>;
export const cos: UnaryParameterInvoke<number>;
export const cot: UnaryParameterInvoke<number>;
export const degrees: UnaryParameterInvoke<number>;
export const floor: UnaryParameterInvoke<number>;
export const log: UnaryParameterInvoke<number>;
export const log10: UnaryParameterInvoke<number>;
export const pi: UnaryParameterInvoke<number>;
export const power: UnaryParameterInvoke<number>;
export const radians: UnaryParameterInvoke<number>;
export const rand: UnaryParameterInvoke<number>;
export const sign: UnaryParameterInvoke<number>;
export const sin: UnaryParameterInvoke<number>;
export const sqrt: UnaryParameterInvoke<number>;
export const square: UnaryParameterInvoke<number>;
export const tan: UnaryParameterInvoke<number>;

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



/**
 * 最后一次插入数据的标识列值
 */
export const IDENTITY: Variant<number>
/**
 * 最后一次执行受影响函数
 */
export const ROWCOUNT: Variant<number>
/**
 * 返回自上次启动 Microsoft SQL Server以来连接或试图连接的次数。
 */
export const CONNECTIONS: Variant<number>
/**
 * 返回自上次启动 Microsoft SQL Server以来 CPU 的工作时间，单位为毫秒（基于系统计时器的分辨率）。
 */
export const CPU_BUSY: Variant<number>
/**
 * 返回 SET DATEFIRST 参数的当前值，SET DATEFIRST 参数指明所规定的每周第一天：1 对应星期一，2 对应星期二，依次类推，用 7 对应星期日。
 */
export const DATEFIRST: Variant<number>
/**
 * 返回 Microsoft SQL Server自上次启动后用于执行输入和输出操作的时间，单位为毫秒（基于系统计时器的分辨率）。
 */
export const IO_BUSY: Variant<number>
/**
 * 返回当前所使用语言的本地语言标识符(ID)。
 */
export const LANGID: Variant<number>
/**
 * 返回当前使用的语言名。
 */
export const LANGUAGE: Variant<string>
/**
 * 返回 Microsoft SQL Server上允许的同时用户连接的最大数。返回的数不必为当前配置的数值。
 */
export const MAX_CONNECTIONS: Variant<number>
/**
 * 返回 Microsoft SQL Server自上次启动后从网络上读取的输入数据包数目。
 */
export const PACK_RECEIVED: Variant<number>
/**
 * 返回 Microsoft SQL Server自上次启动后写到网络上的输出数据包数目。
 */
export const PACK_SENT: Variant<number>
/**
 * 返回自 SQL Server 上次启动后，在 Microsoft SQL Server连接上发生的网络数据包错误数。
 */
export const PACKET_ERRORS: Variant<number>
/**
 * 返回运行 Microsoft SQL Server的本地服务器名称。
 */
export const SERVERNAME: Variant<string>
/**
 * 返回 Microsoft SQL Server正在其下运行的注册表键名。若当前实例为默认实例，则 @@SERVICENAME 返回 MSSQLServer；若当前实例是命名实例，则该函数返回实例名。
 */
export const SERVICENAME: Variant<string>
/**
 * 返回当前用户进程的服务器进程标识符 (ID)。
 */
export const SPID: Variant<number>
/**
 * 返回一刻度的微秒数。

  */
export const TIMETICKS: Variant<number>
/**
 * 返回 Microsoft SQL Server自上次启动后，所遇到的磁盘读/写错误数。
 */
export const TOTAL_ERRORS: Variant<number>
/**
 * 返回 Microsoft SQL Server自上次启动后写入磁盘的次数。
 */
export const TOTAL_WRITE: Variant<number>
/**
 * 返回 Microsoft SQL Server当前安装的日期、版本和处理器类型。
 */
export const VERSION: Variant<string>
/**
 * 返回 Microsoft SQL Server自上次启动后读取磁盘（不是读取高速缓存）的次数。
 */
export const TOTAL_READ: Variant<number>
