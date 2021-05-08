import sql from 'mssql';
import { MssqlProvider } from './provider';
import merge from 'lodash.merge';
import { DefaultCompilerOptions } from './compiler';
import {
  Driver,
  makeFunc,
  variant, ConnectOptions,
  IDbProvider,
  CompatibleExpression,
  Variant,
  ScalarType,
  Expression,
  BuiltIn,
  builtIn,
  Binary,
} from '../../lubejs';

const defaultConnectOptions: sql.config = {
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
  // // 严格模式
  // strict: true
}

const defaultPoolOptions = {
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000
}

/**
 * 连接数据库并返回含数据库连接池的Provider
 * @param config 连接选项
 */
export const connect: Driver = async function(options: ConnectOptions): Promise<IDbProvider> {
  const mssqlOptions: sql.config = Object.assign({}, defaultConnectOptions, options)
  mssqlOptions.server = (options.host + (options.instance ? '\\' + options.instance : '')) || 'localhost',
  mssqlOptions.pool = merge({}, defaultPoolOptions, {
    max: options.poolMax,
    min: options.poolMin,
    idleTimeoutMillis: options.idelTimeout
  })

  const pool = new sql.ConnectionPool(mssqlOptions)
  await pool.connect()
  const compilerOptions = Object.assign(options, DefaultCompilerOptions)
  return new MssqlProvider(pool, compilerOptions)
}

export default connect;

type InvokeHandler0<TResult extends ScalarType> = () => Expression<TResult>;
type InvokeHandler1<TResult extends ScalarType, TArg1 extends ScalarType> = (expr: CompatibleExpression<TArg1>) => Expression<TResult>;
// type InvokeHandler2<TResult extends ScalarType, TArg1 extends ScalarType, TArg2 extends ScalarType> = (arg1: CompatibleExpression<TArg1>, arg2: CompatibleExpression<TArg2>) => Expression<TResult>;
// type InvokeHandler3<TResult extends ScalarType, TArg1 extends ScalarType, TArg2 extends ScalarType, TArg3 extends ScalarType> = (arg1: CompatibleExpression<TArg1>, arg2: CompatibleExpression<TArg2>, arg3: CompatibleExpression<TArg3>) => Expression<TResult>;
// type InvokeHandler4<TResult extends ScalarType, TArg1 extends ScalarType, TArg2 extends ScalarType, TArg3 extends ScalarType, TArg4 extends ScalarType> = (arg1: CompatibleExpression<TArg1>, arg2: CompatibleExpression<TArg2>, arg3: CompatibleExpression<TArg3>, arg4: CompatibleExpression<TArg4>) => Expression<TResult>;

// type InvokeHandler<TResult extends ScalarType, TArg1 extends ScalarType = never, TArg2 extends ScalarType = never, TArg3 extends ScalarType = never, TArg4 extends ScalarType = never> =
//   Targ4 extends never ? (
//     TArg3 extends never ? (
//       TArg2 extends never ? (
//         TArg1 extends never ? InvokeHandler0<TResult> : InvokeHandler1<TResult, TArg1>
//       ) : InvokeHandler2<TResult, TArg1, TArg2>
//     ) : InvokeHandler3<TResult, TArg1, TArg2, TArg3>
//   ) : InvokeHandler4<TResult, TArg1, TArg2, TArg3, TArg4>;

export type DatePart = BuiltIn<keyof typeof DATE_PART>;

export const count: InvokeHandler1<number, any> = makeFunc('scalar', 'count', true);
export const avg: InvokeHandler1<number, number> = makeFunc('scalar', 'avg', true);
export const sum: InvokeHandler1<number, number> = makeFunc('scalar', 'sum', true);
export const max: <T extends Exclude<ScalarType, Binary>>(expr: Expression<T>) => Expression<T> = makeFunc('scalar', 'max', true);
export const min: <T extends Exclude<ScalarType, Binary>>(expr: Expression<T>) => Expression<T> = makeFunc('scalar', 'min', true);
export const exp: InvokeHandler1<number, number> = makeFunc('scalar', 'exp', true);
export const round: (expr: CompatibleExpression<number>, precision: CompatibleExpression<number>) => Expression<number> = makeFunc('scalar', 'round', true);
export const nvl: <T1 extends ScalarType, T2 extends ScalarType>(expr: CompatibleExpression<T1>, default_value: CompatibleExpression<T2>) => Expression<T1 | T2> = makeFunc('scalar', 'nvl', true);
export const stdev: InvokeHandler1<number, number> = makeFunc('scalar', 'stdev', true);
export const dateName: (part: DatePart, date: CompatibleExpression<Date>) => Expression<string> = makeFunc('scalar', 'dateName', true);
export const datePart: (part: DatePart, date: CompatibleExpression<Date>) => Expression<number> = makeFunc('scalar', 'datePart', true);
export const isNull: <T1 extends ScalarType, T2 extends ScalarType>(expr: CompatibleExpression<T1>, default_value: CompatibleExpression<T2>) => Expression<T1 | T2> = makeFunc('scalar', 'isNull', true);
export const len: InvokeHandler1<number, string> = makeFunc('scalar', 'len', true);
export const getDate: InvokeHandler0<Date> = makeFunc('scalar', 'getDate', true);
export const getUtcDate: InvokeHandler0<Date> = makeFunc('scalar', 'getUtcDate', true);
// export const export const date: NoneParameterInvoke<Date> = makeFunc('scalar', 'date', true);
export const month: InvokeHandler1<number, Date> = makeFunc('scalar', 'month', true);
export const year: InvokeHandler1<number, Date> = makeFunc('scalar', 'year', true);
export const day: InvokeHandler1<number, Date> = makeFunc('scalar', 'day', true);
export const dateAdd: (part: DatePart, increment: CompatibleExpression<number>, date: CompatibleExpression<Date>) => Expression<Date> = makeFunc('scalar', 'dateAdd', true);
export const dateDiff: (part: DatePart, startDate: CompatibleExpression<Date>, endDate: CompatibleExpression<Date>) => Expression<number> = makeFunc('scalar', 'dateDiff', true);
export const sysDateTime: InvokeHandler0<Date> = makeFunc('scalar', 'sysDateTime', true);
export const sysUtcDateTime: InvokeHandler0<Date> = makeFunc('scalar', 'sysUtcDateTime', true);
export const charIndex: (pattern: CompatibleExpression<string>, str: CompatibleExpression<string>, startIndex?: CompatibleExpression<number>) => Expression<number> = makeFunc('scalar', 'charIndex', true);
export const left: (str: CompatibleExpression<string>, length: CompatibleExpression<number>) => Expression<number> = makeFunc('scalar', 'left', true);
export const right: (str: CompatibleExpression<string>, length: CompatibleExpression<number>) => Expression<number> = makeFunc('scalar', 'right', true);
export const str: InvokeHandler1<string, ScalarType> = makeFunc('scalar', 'str', true);
export const substring: (expr: CompatibleExpression<string>, start: CompatibleExpression<number>, length: CompatibleExpression<number>) => Expression<string> = makeFunc('scalar', 'substring', true);
export const ascii: InvokeHandler1<number, string> = makeFunc('scalar', 'ascii', true);
export const unicode: InvokeHandler1<number, string> = makeFunc('scalar', 'unicode', true);
export const char: InvokeHandler1<string, number> = makeFunc('scalar', 'char', true);
export const nchar: InvokeHandler1<string, number> = makeFunc('scalar', 'nchar', true);
export const patIndex: (pattern: CompatibleExpression<string>, str: CompatibleExpression<string>) => Expression<number> = makeFunc('scalar', 'patIndex', true);
export const ltrim: InvokeHandler1<string, string> = makeFunc('scalar', 'ltrim', true);
export const rtrim: InvokeHandler1<string, string> = makeFunc('scalar', 'rtrim', true);
export const space: InvokeHandler1<string, number> = makeFunc('scalar', 'space', true);
export const reverse: InvokeHandler1<string, string> = makeFunc('scalar', 'reverse', true);
export const stuff: (expression_to_be_searched: CompatibleExpression<string>, starting_position: CompatibleExpression<number>, number_of_chars: CompatibleExpression<number>, replacement_expression: CompatibleExpression<string>) => Expression<string> = makeFunc('scalar', 'stuff', true);
export const quotedName: InvokeHandler1<string, string> = makeFunc('scalar', 'quotedName', true);
export const lower: InvokeHandler1<string, string> = makeFunc('scalar', 'lower', true);
export const upper: InvokeHandler1<string, string> = makeFunc('scalar', 'upper', true);
export const replace: (expression_to_be_searched: CompatibleExpression<string>, search_expression: CompatibleExpression<string>, replacement_expression: CompatibleExpression<string>) => Expression<string> = makeFunc('scalar', 'replace', true);
export const abs: InvokeHandler1<number, number> = makeFunc('scalar', 'abs', true);
export const acos: InvokeHandler1<number, number> = makeFunc('scalar', 'acos', true);
export const asin: InvokeHandler1<number, number> = makeFunc('scalar', 'asin', true);
export const atan: InvokeHandler1<number, number> = makeFunc('scalar', 'atan', true);
export const atan2: InvokeHandler1<number, number> = makeFunc('scalar', 'atan2', true);
export const ceiling: InvokeHandler1<number, number> = makeFunc('scalar', 'ceiling', true);
export const cos: InvokeHandler1<number, number> = makeFunc('scalar', 'cos', true);
export const cot: InvokeHandler1<number, number> = makeFunc('scalar', 'cot', true);
export const degrees: InvokeHandler1<number, number> = makeFunc('scalar', 'degrees', true);
export const floor: InvokeHandler1<number, number> = makeFunc('scalar', 'floor', true);
export const log: InvokeHandler1<number, number> = makeFunc('scalar', 'log', true);
export const log10: InvokeHandler1<number, number> = makeFunc('scalar', 'log10', true);
export const pi: InvokeHandler0<number> = makeFunc('scalar', 'pi', true);
export const power: InvokeHandler1<number, number> = makeFunc('scalar', 'power', true);
export const radians: InvokeHandler1<number, number> = makeFunc('scalar', 'radians', true);
export const rand: InvokeHandler0<number> = makeFunc('scalar', 'rand', true);
export const sign: InvokeHandler1<number, number> = makeFunc('scalar', 'sign', true);
export const sin: InvokeHandler1<number, number> = makeFunc('scalar', 'sin', true);
export const sqrt: InvokeHandler1<number, number> = makeFunc('scalar', 'sqrt', true);
export const square: InvokeHandler1<number, number> = makeFunc('scalar', 'square', true);
export const tan: InvokeHandler1<number, number> = makeFunc('scalar', 'tan', true);

/**
 * 系统函数声明
 */
export const FUNCTION = {
  count,
  avg,
  sum,
  max,
  min,
  abs,
  exp,
  round,
  floor,
  sqrt,
  power,
  nvl,
  stdev,
  square,
  dateName,
  datePart,
  isNull,
  len,
  getDate,
  getUtcDate,
  month,
  year,
  dateAdd,
  dateDiff,
  sysDateTime,
  sysUtcDateTime,
  charIndex,
  left,
  right,
  str,
  substring,
  ascii,
  char,
  unicode,
  nchar,
  patIndex,
  ltrim,
  rtrim,
  space,
  reverse,
  stuff,
  quotedName,
  lower,
  upper,
  replace,
  rand,
  acos,
  asin,
  atan,
  atan2,
  ceiling,
  cos,
  cot,
  degrees,
  log,
  log10,
  pi,
  radians,
  sign,
  sin,
  tan
}



export const YEAR = builtIn('YEAR');
export const YY = builtIn('YY');
export const YYYY = builtIn('YYYY');
export const QUARTER = builtIn('QUARTER');
export const QQ = builtIn('QQ');
export const Q = builtIn('Q');
export const MONTH = builtIn('MONTH');
export const MM = builtIn('MM');
export const M = builtIn('M');
export const DAYOFYEAR = builtIn('DAYOFYEAR');
export const DY = builtIn('DY');
export const Y = builtIn('Y');
export const DAY = builtIn('DAY');
export const DD = builtIn('DD');
export const D = builtIn('D');
export const WEEK = builtIn('WEEK');
export const WK = builtIn('WK');
export const WW = builtIn('WW');
export const WEEKDAY = builtIn('WEEKDAY');
export const DW = builtIn('DW');
export const HOUR = builtIn('HOUR');
export const HH = builtIn('HH');
export const MINUTE = builtIn('MINUTE');
export const MI = builtIn('MI');
export const N = builtIn('N');
export const SECOND = builtIn('SECOND');
export const SS = builtIn('SS');
export const S = builtIn('S');
export const MILLISECOND = builtIn('MILLISECOND');
export const MS = builtIn('MS');


/**
 * 日期格式部分
 */
 export const DATE_PART = {
  YEAR,
  YY,
  YYYY,
  QUARTER,
  QQ,
  Q,
  MONTH,
  MM,
  M,
  DAYOFYEAR,
  DY,
  Y,
  DAY,
  DD,
  D,
  WEEK,
  WK,
  WW,
  WEEKDAY,
  DW,
  HOUR,
  HH,
  MINUTE,
  MI,
  N,
  SECOND,
  SS,
  S,
  MILLISECOND,
  MS,
};


/**
 * 最后一次插入数据的标识列值
 */
 export const IDENTITY= variant<number, '@@IDENTITY'>('@@IDENTITY');
 /**
  * 最后一次执行受影响函数
  */
 export const ROWCOUNT= variant<number, '@@ROWCOUNT'>('@@ROWCOUNT');
 /**
  * 返回自上次启动 Microsoft SQL Server以来连接或试图连接的次数。
  */
 export const CONNECTIONS= variant<number, '@@CONNECTIONS'>('@@CONNECTIONS');
 /**
  * 返回自上次启动 Microsoft SQL Server以来 CPU 的工作时间，单位为毫秒（基于系统计时器的分辨率）。
  */
 export const CPU_BUSY= variant<number, '@@CPU_BUSY'>('@@CPU_BUSY');
 /**
  * 返回 SET DATEFIRST 参数的当前值，SET DATEFIRST 参数指明所规定的每周第一天：1 对应星期一，2 对应星期二，依次类推，用 7 对应星期日。
  */
 export const DATEFIRST= variant<number, '@@DATEFIRST'>('@@DATEFIRST');
 /**
  * 返回 Microsoft SQL Server自上次启动后用于执行输入和输出操作的时间，单位为毫秒（基于系统计时器的分辨率）。
  */
 export const IO_BUSY= variant<number, '@@IO_BUSY'>('@@IO_BUSY');
 /**
  * 返回当前所使用语言的本地语言标识符(ID)。
  */
 export const LANGID= variant<number, '@@LANGID'>('@@LANGID');
 /**
  * 返回当前使用的语言名。
  */
 export const LANGUAGE= variant<string, '@@LANGUAGE'>('@@LANGUAGE');
 /**
  * 返回 Microsoft SQL Server上允许的同时用户连接的最大数。返回的数不必为当前配置的数值。
  */
 export const MAX_CONNECTIONS= variant<number, '@@MAX_CONNECTIONS'>('@@MAX_CONNECTIONS');
 /**
  * 返回 Microsoft SQL Server自上次启动后从网络上读取的输入数据包数目。
  */
 export const PACK_RECEIVED= variant<number, '@@PACK_RECEIVED'>('@@PACK_RECEIVED');
 /**
  * 返回 Microsoft SQL Server自上次启动后写到网络上的输出数据包数目。
  */
 export const PACK_SENT= variant<number, '@@PACK_SENT'>('@@PACK_SENT');
 /**
  * 返回自 SQL Server 上次启动后，在 Microsoft SQL Server连接上发生的网络数据包错误数。
  */
 export const PACKET_ERRORS= variant<number, '@@PACKET_ERRORS'>('@@PACKET_ERRORS');
 /**
  * 返回运行 Microsoft SQL Server的本地服务器名称。
  */
 export const SERVERNAME= variant<string, '@@SERVERNAME'>('@@SERVERNAME');
 /**
  * 返回 Microsoft SQL Server正在其下运行的注册表键名。若当前实例为默认实例，则 @@SERVICENAME 返回 MSSQLServer；若当前实例是命名实例，则该函数返回实例名。
  */
 export const SERVICENAME= variant<string, '@@SERVICENAME'>('@@SERVICENAME');
 /**
  * 返回当前用户进程的服务器进程标识符 (ID)。
  */
 export const SPID= variant<number, '@@SPID'>('@@SPID');
 /**
  * 返回一刻度的微秒数。
  */
 export const TIMETICKS= variant<number, '@@TIMETICKS'>('@@TIMETICKS');
 /**
  * 返回 Microsoft SQL Server自上次启动后，所遇到的磁盘读/写错误数。
  */
 export const TOTAL_ERRORS= variant<number, '@@TOTAL_ERRORS'>('@@TOTAL_ERRORS');
 /**
  * 返回 Microsoft SQL Server自上次启动后写入磁盘的次数。
  */
 export const TOTAL_WRITE= variant<number, '@@TOTAL_WRITE'>('@@TOTAL_WRITE');
 /**
  * 返回 Microsoft SQL Server当前安装的日期、版本和处理器类型。
  */
 export const VERSION= variant<string, '@@VERSION'>('@@VERSION');
 /**
  * 返回 Microsoft SQL Server自上次启动后读取磁盘（不是读取高速缓存）的次数。
  */
 export const TOTAL_READ= variant<number, '@@TOTAL_READ'>('@@TOTAL_READ');


/**
 * 系统变量
 */
export const VARIANTS = {
  /**
   * 最后一次插入数据的标识列值
   */
  IDENTITY,
  /**
   * 最后一次执行受影响函数
   */
  ROWCOUNT,
  /**
   * 返回自上次启动 Microsoft SQL Server以来连接或试图连接的次数。
   */
  CONNECTIONS,
  /**
   * 返回自上次启动 Microsoft SQL Server以来 CPU 的工作时间，单位为毫秒（基于系统计时器的分辨率）。
   */
  CPU_BUSY,
  /**
   * 返回 SET DATEFIRST 参数的当前值，SET DATEFIRST 参数指明所规定的每周第一天：1 对应星期一，2 对应星期二，依次类推，用 7 对应星期日。
   */
  DATEFIRST,
  /**
   * 返回 Microsoft SQL Server自上次启动后用于执行输入和输出操作的时间，单位为毫秒（基于系统计时器的分辨率）。
   */
  IO_BUSY,
  /**
   * 返回当前所使用语言的本地语言标识符(ID)。
   */
  LANGID,
  /**
   * 返回当前使用的语言名。
   */
  LANGUAGE,
  /**
   * 返回 Microsoft SQL Server上允许的同时用户连接的最大数。返回的数不必为当前配置的数值。
   */
  MAX_CONNECTIONS,
  /**
   * 返回 Microsoft SQL Server自上次启动后从网络上读取的输入数据包数目。
   */
  PACK_RECEIVED,
  /**
   * 返回 Microsoft SQL Server自上次启动后写到网络上的输出数据包数目。
   */
  PACK_SENT,
  /**
   * 返回自 SQL Server 上次启动后，在 Microsoft SQL Server连接上发生的网络数据包错误数。
   */
  PACKET_ERRORS,
  /**
   * 返回运行 Microsoft SQL Server的本地服务器名称。
   */
  SERVERNAME,
  /**
   * 返回 Microsoft SQL Server正在其下运行的注册表键名。若当前实例为默认实例，则 @@SERVICENAME 返回 MSSQLServer；若当前实例是命名实例，则该函数返回实例名。
   */
  SERVICENAME,
  /**
   * 返回当前用户进程的服务器进程标识符 (ID)。
   */
  SPID,
  /**
   * 返回一刻度的微秒数。
   */
  TIMETICKS,
  /**
   * 返回 Microsoft SQL Server自上次启动后，所遇到的磁盘读/写错误数。
   */
  TOTAL_ERRORS,
  /**
   * 返回 Microsoft SQL Server自上次启动后写入磁盘的次数。
   */
  TOTAL_WRITE,
  /**
   * 返回 Microsoft SQL Server当前安装的日期、版本和处理器类型。
   */
  VERSION,
  /**
   * 返回 Microsoft SQL Server自上次启动后读取磁盘（不是读取高速缓存）的次数。
   */
  TOTAL_READ,
}
