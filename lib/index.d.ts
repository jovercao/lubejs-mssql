import { Raw, ConnectOptions, IDbProvider, Expressions, Invoke, Variant, JsConstant, Expression } from '../../lubejs/lib/lube';

/**
 * 连接数据库并返回含数据库连接池的Provider
 * @param config 连接选项
 */
export function connect(config: ConnectOptions): Promise<IDbProvider>;

export default connect;

type DatePart = Raw<any>;

type InvokeHandler0<TResult extends JsConstant> = () => Expression<TResult>;
type InvokeHandler1<TResult extends JsConstant, TArg1 extends JsConstant> = (expr: Expressions<TArg1>) => Expression<TResult>;
type InvokeHandler2<TResult extends JsConstant, TArg1 extends JsConstant, TArg2 extends JsConstant> = (arg1: Expressions<TArg1>, arg2: Expressions<TArg2>) => Expression<TResult>;
type InvokeHandler3<TResult extends JsConstant, TArg1 extends JsConstant, TArg2 extends JsConstant, TArg3 extends JsConstant> = (arg1: Expressions<TArg1>, arg2: Expressions<TArg2>, arg3: Expressions<TArg3>) => Expression<TResult>;
type InvokeHandler4<TResult extends JsConstant, TArg1 extends JsConstant, TArg2 extends JsConstant, TArg3 extends JsConstant, TArg4 extends JsConstant> = (arg1: Expressions<TArg1>, arg2: Expressions<TArg2>, arg3: Expressions<TArg3>, arg4: Expressions<TArg4>) => Expression<TResult>;

type InvokeHandler<TResult extends JsConstant, TArg1 extends JsConstant = never, TArg2 extends JsConstant = never, TArg3 extends JsConstant = never, TArg4 extends JsConstant = never> =
  Targ4 extends never ? (
    TArg3 extends never ? (
      TArg2 extends never ? (
        TArg1 extends never ? InvokeHandler0<TResult> : InvokeHandler1<TResult, TArg1>
      ) : InvokeHandler2<TResult, TArg1, TArg2>
    ) : InvokeHandler3<TResult, TArg1, TArg2, TArg3>
  ) : InvokeHandler4<TResult, TArg1, TArg2, TArg3, TArg4>;

/**
 * 系统函数
 */
export const FUNCTIONS: {
  count: InvokeHandler1<number, any>;
  avg: InvokeHandler1<number, number>;
  sum: InvokeHandler1<number, number>;
  max: <T extends number | string>(expr: Expression<T>) => Expressions<T>;
  min: <T extends number | string>(expr: Expression<T>) => Expressions<T>;
  exp: InvokeHandler1<number, number>;
  round: (expr: Expressions<number>, precision: Expressions<number>) => Expression<number>;
  nvl: <T1, T2>(expr: Expressions<T1>, default_value: Expressions<T2>) => Expressions<T1 | T2>;
  stdev: InvokeHandler1<number, number>;
  dateName: InvokeHandler1<string, Date>;
  datePart: InvokeHandler1<number, Date>;
  isNull: <T1, T2>(expr: Expressions<T1>, default_value: Expressions<T2>) => Expressions<T1 | T2>;
  len: InvokeHandler1<number, string>;
  getDate: InvokeHandler0<Date>;
  getUtcDate: InvokeHandler0<Date>;
  // export const date: NoneParameterInvoke<Date>;
  month: InvokeHandler1<number, Date>;
  year: InvokeHandler1<number, Date>;
  day: InvokeHandler1<number, Date>;
  dateAdd: (part: DatePart, increment: Expressions<number>, date: Expressions<Date>) => Expression<Date>;
  dateDiff: (part: DatePart, startDate: Expressions<Date>, endDate: Expressions<Date>) => Expression<Date>;
  sysDateTime: InvokeHandler0<Date>;
  sysUtcDateTime: InvokeHandler0<Date>;
  charIndex: (pattern: Expressions<string>, str: Expressions<string>, startIndex?: Expressions<number>) => Expression<number>;
  left: (str: Expressions<string>, length: Expressions<number>) => Invoke<number>;
  right: (str: Expressions<string>, length: Expressions<number>) => Invoke<number>;
  str: InvokeHandler0<string, JsConstant>;
  substring: (expr: Expressions<string>, start: Expressions<number>, length: Expressions<number>) => Expression<string>;
  ascii: InvokeHandler1<number, string>;
  unicode: InvokeHandler1<number, string>;
  char: InvokeHandler1<string, number>;
  nchar: InvokeHandler1<string, number>;
  patIndex: (pattern: Expressions<string>, str: Expressions<string>) => Expression<number>;
  ltrim: InvokeHandler1<string, string>;
  rtrim: InvokeHandler1<string, string>;
  space: InvokeHandler1<string, number>;
  reverse: InvokeHandler1<string, string>;
  stuff: (expression_to_be_searched: Expressions<string>, starting_position: Expressions<number>, number_of_chars: Expressions<number>, replacement_expression: Expressions<string>) => Invoke;
  quotedName: InvokeHandler1<string, string>;
  lower: InvokeHandler1<string, string>;
  upper: InvokeHandler1<string, string>;
  replace: (expression_to_be_searched: Expressions<string>, search_expression: Expressions<string>, replacement_expression: Expressions<string>) => Invoke;
  abs: InvokeHandler1<number, number>;
  acos: InvokeHandler1<number, number>;
  asin: InvokeHandler1<number, number>;
  atan: InvokeHandler1<number, number>;
  atn2: InvokeHandler1<number, number>;
  ceiling: InvokeHandler1<number, number>;
  cos: InvokeHandler1<number, number>;
  cot: InvokeHandler1<number, number>;
  degrees: InvokeHandler1<number, number>;
  floor: InvokeHandler1<number, number>;
  log: InvokeHandler1<number, number>;
  log10: InvokeHandler1<number, number>;
  pi: InvokeHandler0<number>;
  power: InvokeHandler1<number, number>;
  radians: InvokeHandler1<number, number>;
  rand: InvokeHandler0<number>;
  sign: InvokeHandler1<number, number>;
  sin: InvokeHandler1<number, number>;
  sqrt: InvokeHandler1<number, number>;
  square: InvokeHandler1<number, number>;
  tan: InvokeHandler1<number, number>;
};

export const count: InvokeHandler1<number, any>;
export const avg: InvokeHandler1<number, number>;
export const sum: InvokeHandler1<number, number>;
export const max: <T extends number | string>(expr: Expression<T>) => Expressions<T>;
export const min: <T extends number | string>(expr: Expression<T>) => Expressions<T>;
export const exp: InvokeHandler1<number, number>;
export const round: (expr: Expressions<number>, precision: Expressions<number>) => Expression<number>;
export const nvl: <T1, T2>(expr: Expressions<T1>, default_value: Expressions<T2>) => Expressions<T1 | T2>;
export const stdev: InvokeHandler1<number, number>;
export const dateName: InvokeHandler1<string, Date>;
export const datePart: InvokeHandler1<number, Date>;
export const isNull: <T1, T2>(expr: Expressions<T1>, default_value: Expressions<T2>) => Expressions<T1 | T2>;
export const len: InvokeHandler1<number, string>;
export const getDate: InvokeHandler0<Date>;
export const getUtcDate: InvokeHandler0<Date>;
// export const date: NoneParameterInvoke<Date>;
export const month: InvokeHandler1<number, Date>;
export const year: InvokeHandler1<number, Date>;
export const day: InvokeHandler1<number, Date>;
export const dateAdd: (part: DatePart, increment: Expressions<number>, date: Expressions<Date>) => Expression<Date>;
export const dateDiff: (part: DatePart, startDate: Expressions<Date>, endDate: Expressions<Date>) => Expression<Date>;
export const sysDateTime: InvokeHandler0<Date>;
export const sysUtcDateTime: InvokeHandler0<Date>;
export const charIndex: (pattern: Expressions<string>, str: Expressions<string>, startIndex?: Expressions<number>) => Expression<number>;
export const left: (str: Expressions<string>, length: Expressions<number>) => Invoke<number>;
export const right: (str: Expressions<string>, length: Expressions<number>) => Invoke<number>;
export const str: InvokeHandler0<string, JsConstant>;
export const substring: (expr: Expressions<string>, start: Expressions<number>, length: Expressions<number>) => Expression<string>;
export const ascii: InvokeHandler1<number, string>;
export const unicode: InvokeHandler1<number, string>;
export const char: InvokeHandler1<string, number>;
export const nchar: InvokeHandler1<string, number>;
export const patIndex: (pattern: Expressions<string>, str: Expressions<string>) => Expression<number>;
export const ltrim: InvokeHandler1<string, string>;
export const rtrim: InvokeHandler1<string, string>;
export const space: InvokeHandler1<string, number>;
export const reverse: InvokeHandler1<string, string>;
export const stuff: (expression_to_be_searched: Expressions<string>, starting_position: Expressions<number>, number_of_chars: Expressions<number>, replacement_expression: Expressions<string>) => Invoke;
export const quotedName: InvokeHandler1<string, string>;
export const lower: InvokeHandler1<string, string>;
export const upper: InvokeHandler1<string, string>;
export const replace: (expression_to_be_searched: Expressions<string>, search_expression: Expressions<string>, replacement_expression: Expressions<string>) => Invoke;
export const abs: InvokeHandler1<number, number>;
export const acos: InvokeHandler1<number, number>;
export const asin: InvokeHandler1<number, number>;
export const atan: InvokeHandler1<number, number>;
export const atn2: InvokeHandler1<number, number>;
export const ceiling: InvokeHandler1<number, number>;
export const cos: InvokeHandler1<number, number>;
export const cot: InvokeHandler1<number, number>;
export const degrees: InvokeHandler1<number, number>;
export const floor: InvokeHandler1<number, number>;
export const log: InvokeHandler1<number, number>;
export const log10: InvokeHandler1<number, number>;
export const pi: InvokeHandler0<number>;
export const power: InvokeHandler1<number, number>;
export const radians: InvokeHandler1<number, number>;
export const rand: InvokeHandler0<number>;
export const sign: InvokeHandler1<number, number>;
export const sin: InvokeHandler1<number, number>;
export const sqrt: InvokeHandler1<number, number>;
export const square: InvokeHandler1<number, number>;
export const tan: InvokeHandler1<number, number>;

/**
 * 日期格式部分
 */
export const DATE_PART: {
  YEAR: DatePart;
  YY: DatePart;
  YYYY: DatePart;
  QUARTER: DatePart;
  QQ: DatePart;
  Q: DatePart;
  MONTH: DatePart;
  MM: DatePart;
  M: DatePart;
  DAYOFYEAR: DatePart;
  DY: DatePart;
  Y: DatePart;
  DAY: DatePart;
  DD: DatePart;
  D: DatePart;
  WEEK: DatePart;
  WK: DatePart;
  WW: DatePart;
  WEEKDAY: DatePart;
  DW: DatePart;
  HOUR: DatePart;
  HH: DatePart;
  MINUTE: DatePart;
  MI: DatePart;
  N: DatePart;
  SECOND: DatePart;
  SS: DatePart;
  S: DatePart;
  MILLISECOND: DatePart;
  MS: DatePart;
}

export const YEAR: DatePart;
export const YY: DatePart;
export const YYYY: DatePart;
export const QUARTER: DatePart;
export const QQ: DatePart;
export const Q: DatePart;
export const MONTH: DatePart;
export const MM: DatePart;
export const M: DatePart;
export const DAYOFYEAR: DatePart;
export const DY: DatePart;
export const Y: DatePart;
export const DAY: DatePart;
export const DD: DatePart;
export const D: DatePart;
export const WEEK: DatePart;
export const WK: DatePart;
export const WW: DatePart;
export const WEEKDAY: DatePart;
export const DW: DatePart;
export const HOUR: DatePart;
export const HH: DatePart;
export const MINUTE: DatePart;
export const MI: DatePart;
export const N: DatePart;
export const SECOND: DatePart;
export const SS: DatePart;
export const S: DatePart;
export const MILLISECOND: DatePart;
export const MS: DatePart

/**
 * 系统变量
 */
export const VARIANTS: {
  /**
   * 最后一次插入数据的标识列值
   */
  IDENTITY: Variant<number>;
  /**
   * 最后一次执行受影响函数
   */
  ROWCOUNT: Variant<number>;
  /**
   * 返回自上次启动 Microsoft SQL Server以来连接或试图连接的次数。
   */
  CONNECTIONS: Variant<number>;
  /**
   * 返回自上次启动 Microsoft SQL Server以来 CPU 的工作时间，单位为毫秒（基于系统计时器的分辨率）。
   */
  CPU_BUSY: Variant<number>;
  /**
   * 返回 SET DATEFIRST 参数的当前值，SET DATEFIRST 参数指明所规定的每周第一天：1 对应星期一，2 对应星期二，依次类推，用 7 对应星期日。
   */
  DATEFIRST: Variant<number>;
  /**
   * 返回 Microsoft SQL Server自上次启动后用于执行输入和输出操作的时间，单位为毫秒（基于系统计时器的分辨率）。
   */
  IO_BUSY: Variant<number>;
  /**
   * 返回当前所使用语言的本地语言标识符(ID)。
   */
  LANGID: Variant<number>;
  /**
   * 返回当前使用的语言名。
   */
  LANGUAGE: Variant<string>;
  /**
   * 返回 Microsoft SQL Server上允许的同时用户连接的最大数。返回的数不必为当前配置的数值。
   */
  MAX_CONNECTIONS: Variant<number>;
  /**
   * 返回 Microsoft SQL Server自上次启动后从网络上读取的输入数据包数目。
   */
  PACK_RECEIVED: Variant<number>;
  /**
   * 返回 Microsoft SQL Server自上次启动后写到网络上的输出数据包数目。
   */
  PACK_SENT: Variant<number>;
  /**
   * 返回自 SQL Server 上次启动后，在 Microsoft SQL Server连接上发生的网络数据包错误数。
   */
  PACKET_ERRORS: Variant<number>;
  /**
   * 返回运行 Microsoft SQL Server的本地服务器名称。
   */
  SERVERNAME: Variant<string>;
  /**
   * 返回 Microsoft SQL Server正在其下运行的注册表键名。若当前实例为默认实例，则 @@SERVICENAME 返回 MSSQLServer；若当前实例是命名实例，则该函数返回实例名。
   */
  SERVICENAME: Variant<string>;
  /**
   * 返回当前用户进程的服务器进程标识符 (ID)。
   */
  SPID: Variant<number>;
  /**
   * 返回一刻度的微秒数。
   */
  TIMETICKS: Variant<number>;
  /**
   * 返回 Microsoft SQL Server自上次启动后，所遇到的磁盘读/写错误数。
   */
  TOTAL_ERRORS: Variant<number>;
  /**
   * 返回 Microsoft SQL Server自上次启动后写入磁盘的次数。
   */
  TOTAL_WRITE: Variant<number>;
  /**
   * 返回 Microsoft SQL Server当前安装的日期、版本和处理器类型。
   */
  VERSION: Variant<string>;
  /**
   * 返回 Microsoft SQL Server自上次启动后读取磁盘（不是读取高速缓存）的次数。
   */
  TOTAL_READ: Variant<number>;
}

/**
 * 最后一次插入数据的标识列值
 */
export const IDENTITY: Variant<number>;
/**
 * 最后一次执行受影响函数
 */
export const ROWCOUNT: Variant<number>;
/**
 * 返回自上次启动 Microsoft SQL Server以来连接或试图连接的次数。
 */
export const CONNECTIONS: Variant<number>;
/**
 * 返回自上次启动 Microsoft SQL Server以来 CPU 的工作时间，单位为毫秒（基于系统计时器的分辨率）。
 */
export const CPU_BUSY: Variant<number>;
/**
 * 返回 SET DATEFIRST 参数的当前值，SET DATEFIRST 参数指明所规定的每周第一天：1 对应星期一，2 对应星期二，依次类推，用 7 对应星期日。
 */
export const DATEFIRST: Variant<number>;
/**
 * 返回 Microsoft SQL Server自上次启动后用于执行输入和输出操作的时间，单位为毫秒（基于系统计时器的分辨率）。
 */
export const IO_BUSY: Variant<number>;
/**
 * 返回当前所使用语言的本地语言标识符(ID)。
 */
export const LANGID: Variant<number>;
/**
 * 返回当前使用的语言名。
 */
export const LANGUAGE: Variant<string>;
/**
 * 返回 Microsoft SQL Server上允许的同时用户连接的最大数。返回的数不必为当前配置的数值。
 */
export const MAX_CONNECTIONS: Variant<number>;
/**
 * 返回 Microsoft SQL Server自上次启动后从网络上读取的输入数据包数目。
 */
export const PACK_RECEIVED: Variant<number>;
/**
 * 返回 Microsoft SQL Server自上次启动后写到网络上的输出数据包数目。
 */
export const PACK_SENT: Variant<number>;
/**
 * 返回自 SQL Server 上次启动后，在 Microsoft SQL Server连接上发生的网络数据包错误数。
 */
export const PACKET_ERRORS: Variant<number>;
/**
 * 返回运行 Microsoft SQL Server的本地服务器名称。
 */
export const SERVERNAME: Variant<string>;
/**
 * 返回 Microsoft SQL Server正在其下运行的注册表键名。若当前实例为默认实例，则 @@SERVICENAME 返回 MSSQLServer；若当前实例是命名实例，则该函数返回实例名。
 */
export const SERVICENAME: Variant<string>;
/**
 * 返回当前用户进程的服务器进程标识符 (ID)。
 */
export const SPID: Variant<number>;
/**
 * 返回一刻度的微秒数。
 */
export const TIMETICKS: Variant<number>;
/**
 * 返回 Microsoft SQL Server自上次启动后，所遇到的磁盘读/写错误数。
 */
export const TOTAL_ERRORS: Variant<number>;
/**
 * 返回 Microsoft SQL Server自上次启动后写入磁盘的次数。
 */
export const TOTAL_WRITE: Variant<number>;
/**
 * 返回 Microsoft SQL Server当前安装的日期、版本和处理器类型。
 */
export const VERSION: Variant<string>;
/**
 * 返回 Microsoft SQL Server自上次启动后读取磁盘（不是读取高速缓存）的次数。
 */
export const TOTAL_READ: Variant<number>;
