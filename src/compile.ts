import {
  ascii,
  avg,
  char,
  charIndex,
  convert,
  format,
  count,
  dateDiff,
  datePart,
  DATE_PART,
  getDate,
  IDENTITY,
  len,
  lower,
  ltrim,
  max,
  min,
  replace,
  rtrim,
  substring,
  sum,
  unicode,
  upper,
  sysDateTimeOffset,
  sysUtcDateTime,
  switchOffset,
  dateAdd,
  isNull,
  abs,
  exp,
  ceiling,
  floor,
  log,
  log10,
  pi,
  power,
  radians,
  degrees,
  rand,
  round,
  sign,
  sqrt,
  cos,
  sin,
  tan,
  acos,
  asin,
  atan,
  atan2,
  cot,
} from './build-in';
import {
  Compiler,
  CompileOptions,
  DbType,
  Select,
  Parameter,
  StandardTranslator,
  CompatibleExpression,
  Star,
  Expression,
  func,
  Scalar,
  Binary,
  TsTypeOf,
  mod,
  TableVariantDeclare,
  Insert,
  AST,
} from '../../lubejs';

import { dbTypeToSql } from './types';

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
  fieldAliasJoinWith: 'AS',

  // blockSplitWord: '\nGO\n',
};

// const MssqlFormatStyleIdMap = {
//   'mon dd yyyy hh:miAM ': 100,
//   'mon dd yyyy hh:miPM ': 0,
//   'mm/dd/yy': 101,
//   'yy.mm.dd': 102,
//   'dd/mm/yy': 103,
//   'dd.mm.yy': 104,
//   'dd-mm-yy': 105,
//   'dd mon yy': 106,
//   'Mon dd, yy': 107,
//   'hh:mm:ss': 108,
//   'mon dd yyyy hh:mi:ss:mmmAM': 109,
//   'mon dd yyyy hh:mi:ss:mmmPM': 9,
//   'mm-dd-yy': 110,
//   'yy/mm/dd': 111,
//   'yymmdd': 112,
//   'dd mon yyyy hh:mm:ss:mmm(24h)': 113,
//   'hh:mi:ss:mmm(24h)': 114,
//   'yyyy-mm-dd hh:mi:ss(24h': 120,
//   'yyyy-mm-dd hh:mi:ss.mmm(24h)': 121,
//   'yyyy-mm-ddThh:mm:ss.mmm': 126,
//   'dd mon yyyy hh:mi:ss:mmmAM': 130,
//   'dd/mm/yy hh:mi:ss:mmmAM': 131,
// }

export class MssqlStandardTranslator implements StandardTranslator {
  abs(value: CompatibleExpression<number>): Expression<number> {
    return abs(value);
  }
  exp(value: CompatibleExpression<number>): Expression<number> {
    return exp(value);
  }

  ceil(value: CompatibleExpression<number>): Expression<number> {
    return ceiling(value);
  }
  floor(value: CompatibleExpression<number>): Expression<number> {
    return floor(value);
  }
  ln(value: CompatibleExpression<number>): Expression<number> {
    return log10(value);
  }
  log(value: CompatibleExpression<number>): Expression<number> {
    return log(value);
  }
  mod(
    value: CompatibleExpression<number>,
    x: CompatibleExpression<number>
  ): Expression<number> {
    return mod(value, x);
  }
  pi(): Expression<number> {
    return pi();
  }
  power(
    a: CompatibleExpression<number>,
    b: CompatibleExpression<number>
  ): Expression<number> {
    return power(a, b);
  }
  radians(value: CompatibleExpression<number>): Expression<number> {
    return radians(value);
  }
  degrees(value: CompatibleExpression<number>): Expression<number> {
    return degrees(value);
  }
  random(): Expression<number> {
    return rand();
  }
  round(
    value: CompatibleExpression<number>,
    s?: CompatibleExpression<number>
  ): Expression<number> {
    return round(value, s);
  }
  sign(value: CompatibleExpression<number>): Expression<number> {
    return sign(value);
  }
  sqrt(value: CompatibleExpression<number>): Expression<number> {
    return sqrt(value);
  }

  cos(value: CompatibleExpression<number>): Expression<number> {
    return cos(value);
  }

  sin(value: CompatibleExpression<number>): Expression<number> {
    return sin(value);
  }
  tan(value: CompatibleExpression<number>): Expression<number> {
    return tan(value);
  }
  acos(value: CompatibleExpression<number>): Expression<number> {
    return acos(value);
  }
  asin(value: CompatibleExpression<number>): Expression<number> {
    return asin(value);
  }
  atan(value: CompatibleExpression<number>): Expression<number> {
    return atan(value);
  }
  atan2(value: CompatibleExpression<number>): Expression<number> {
    return atan2(value);
  }
  cot(value: CompatibleExpression<number>): Expression<number> {
    return cot(value);
  }

  isNull<T extends Scalar>(
    value: CompatibleExpression<T>,
    defaultValue: CompatibleExpression<T>
  ): Expression<T> {
    return isNull(value, defaultValue);
  }

  count(expr: Star | CompatibleExpression<Scalar>): Expression<number> {
    return count(expr);
  }

  avg(expr: CompatibleExpression<number>): Expression<number> {
    return avg(expr);
  }

  sum(expr: CompatibleExpression<number>): Expression<number> {
    return sum(expr);
  }

  max<T extends Exclude<Scalar, Binary>>(expr: Expression<T>): Expression<T> {
    return max(expr);
  }

  min<T extends Exclude<Scalar, Binary>>(expr: Expression<T>): Expression<T> {
    return min(expr);
  }

  /**
   * 获取标识列的最近插入值
   * @param table
   * @param column
   * @returns
   */
  identityValue(
    table: CompatibleExpression<string>,
    column: CompatibleExpression<string>
  ): Expression<number> {
    return IDENTITY;
    // return StandardOperation.create(identityValue.name, [table, column]);
  }

  /**
   * 转换数据类型
   * @param expr
   * @param toType
   * @returns
   */
  convert<T extends DbType>(
    expr: CompatibleExpression,
    toType: T
  ): Expression<TsTypeOf<T>> {
    return convert(toType, expr);
  }

  /**
   * 获取当前日期及时间
   * @returns
   */
  now(): Expression<Date> {
    return sysDateTimeOffset();
  }

  /**
   * 获取当前UTC时间
   * @returns
   */
  utcNow(): Expression<Date> {
    return sysUtcDateTime();
  }

  /**
   * 切换时区
   */
  switchTimezone(
    date: CompatibleExpression<Date>,
    timeZone: CompatibleExpression<string>
  ): Expression<Date> {
    return switchOffset(date, timeZone);
  }

  /**
   * 格式化日期函数
   * @param date
   * @param format
   * @returns
   */
  formatDate(
    date: CompatibleExpression<Date>,
    fmt: string
  ): Expression<string> {
    return format(date, fmt);
  }

  /**
   * 获取日期中的年份
   * @param date
   * @returns
   */
  yearOf(date: CompatibleExpression<Date>): Expression<number> {
    return datePart(DATE_PART.YEAR, date);
  }

  /**
   * 获取日期中的月份
   * @param date
   * @returns
   */
  monthOf(date: CompatibleExpression<Date>): Expression<number> {
    return datePart(DATE_PART.MONTH, date);
  }

  /**
   * 获取日期中的日
   * @param date
   * @returns
   */
  dayOf(date: CompatibleExpression<Date>): Expression<number> {
    return datePart(DATE_PART.DAY, date);
  }

  /**
   * 计算两个日期之间的天数，小数
   * @param start
   * @param end
   * @returns
   */
  daysBetween(
    start: CompatibleExpression<Date>,
    end: CompatibleExpression<Date>
  ): Expression<number> {
    return dateDiff(DATE_PART.DAY, start, end);
  }

  /**
   * 计算两个日期之间的天数，小数
   * @param start
   * @param end
   * @returns
   */
  monthsBetween(
    start: CompatibleExpression<Date>,
    end: CompatibleExpression<Date>
  ): Expression<number> {
    return dateDiff(DATE_PART.MONTH, start, end);
  }

  /**
   * 计算两个日期之间的天数，小数
   * @param start
   * @param end
   * @returns
   */
  yearsBetween(
    start: CompatibleExpression<Date>,
    end: CompatibleExpression<Date>
  ): Expression<number> {
    return dateDiff(DATE_PART.YEAR, start, end);
  }

  /**
   * 计算两个日期之间的天数，小数
   * @param start
   * @param end
   * @returns
   */
  hoursBetween(
    start: CompatibleExpression<Date>,
    end: CompatibleExpression<Date>
  ): Expression<number> {
    return dateDiff(DATE_PART.HOUR, start, end);
  }

  /**
   * 计算两个日期之间的天数，小数
   * @param start
   * @param end
   * @returns
   */
  minutesBetween(
    start: CompatibleExpression<Date>,
    end: CompatibleExpression<Date>
  ): Expression<number> {
    return dateDiff(DATE_PART.MINUTE, start, end);
  }

  /**
   * 计算两个日期之间的天数，小数
   * @param start
   * @param end
   * @returns
   */
  secondsBetween(
    start: CompatibleExpression<Date>,
    end: CompatibleExpression<Date>
  ): Expression<number> {
    return dateDiff(DATE_PART.SECOND, start, end);
  }

  addDays(
    date: CompatibleExpression<Date>,
    days: CompatibleExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.DAY, days, date);
  }

  addMonths(
    date: CompatibleExpression<Date>,
    months: CompatibleExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.MONTH, months, date);
  }

  addYears(
    date: CompatibleExpression<Date>,
    years: CompatibleExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.YEAR, years, date);
  }

  addHours(
    date: CompatibleExpression<Date>,
    hours: CompatibleExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.HOUR, hours, date);
  }

  addMinutes(
    date: CompatibleExpression<Date>,
    minutes: CompatibleExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.MINUTE, minutes, date);
  }

  addSeconds(
    date: CompatibleExpression<Date>,
    seconds: CompatibleExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.SECOND, seconds, date);
  }

  /**
   * 获取字符串长度
   * @param str
   * @returns
   */
  strlen(str: CompatibleExpression<string>): Expression<number> {
    return len(str);
  }

  /**
   * 截取字符串
   * @param str
   * @param start
   * @param length
   * @returns
   */
  substr(
    str: CompatibleExpression<string>,
    start: CompatibleExpression<number>,
    length: CompatibleExpression<number>
  ): Expression<string> {
    return substring(str, start, length);
  }

  /**
   * 替换字符串
   * @param str 需要被替换的字符串
   * @param search 查找字符串
   * @param to 替换成字符串
   * @param global 是否全局替换，默认为false
   * @returns
   */
  replace(
    str: CompatibleExpression<string>,
    search: CompatibleExpression<string>,
    to: CompatibleExpression<string>
  ): Expression<string> {
    return replace(str, search, to);
  }

  /**
   * 删除字符串两侧空格
   * @param str
   * @returns
   */
  trim(str: CompatibleExpression<string>): Expression<string> {
    return ltrim(rtrim(str));
  }

  /**
   * 删除字符串右侧空格
   * @param str
   * @returns
   */
  trimEnd(str: CompatibleExpression<string>): Expression<string> {
    return rtrim(str);
  }
  /**
   * 转换成大写字母
   * @param str
   * @returns
   */
  upper(str: CompatibleExpression<string>): Expression<string> {
    return upper(str);
  }

  /**
   * 转换成小写字母
   * @param str
   * @returns
   */
  lower(str: CompatibleExpression<string>): Expression<string> {
    return lower(str);
  }

  /**
   * 查找一个
   * @param str
   * @param search
   * @returns
   */
  strpos(
    str: CompatibleExpression<string>,
    search: CompatibleExpression<string>,
    startAt?: CompatibleExpression<number>
  ): Expression<number> {
    return charIndex(search, str, startAt);
  }

  /**
   * 获取一个字符的ascii码
   * @param str 字符编码
   * @returns
   */
  ascii(str: CompatibleExpression<string>): Expression<number> {
    return ascii(str);
  }

  asciiChar(code: CompatibleExpression<number>): Expression<string> {
    return char(code);
  }

  unicode(str: CompatibleExpression<string>): Expression<number> {
    return unicode(str);
  }

  unicodeChar(code: CompatibleExpression<number>): Expression<string> {
    return char(code);
  }
}

const defaultTranslator = new MssqlStandardTranslator();

export class MssqlCompiler extends Compiler {
  protected compileInsert(
    insert: Insert,
    params: Set<Parameter<Scalar, string>>,
    parent?: AST
  ): string {
    const sql = super.compileInsert(insert, params, parent);
    if (!insert.$identityInsert) return sql;
    return `SET IDENTITY_INSERT ON
${sql}
SET IDENTITY_INSERT OFF
`;
  }

  protected compileTableVariantDeclare(
    declare: TableVariantDeclare<any>
  ): string {
    throw new Error(`待完成!`);
    //     if (declare.$schema.foreignKeys?.length > 0) {
    //       throw new Error(`Table variant is not support foreign key at mssql.`);
    //     }
    //     return `DECLARE @${this.stringifyIdentifier(declare.$name)} TABLE(
    // ${[
    //   ...declare.$schema.columns.map((column) => {
    //     if (column.isCalculate) {
    //       return `${this.quoted(column.name)} AS ${column.calculateExpression}`;
    //     }
    //     let columnDesc = `${this.quoted(column.name)} ${this.compileType(
    //       column.type
    //     )} ${column.isNullable ? "NULL" : "NOT NULL"}`;
    //     if (column.isIdentity) {
    //       columnDesc += ` IDENTITY(${column.identityStartValue}, ${column.identityIncrement})`;
    //     }
    //     return columnDesc;
    //   }),
    //   ...declare.$schema.indexes.map((index) => {
    //     if (index.isPrimaryKey) {
    //       return `PRIMARY KEY (${index.columns
    //         .map((col) => this.quoted(col))
    //         .join(", ")})`;
    //     }
    //     if (index.isUnique) {
    //       throw new Error(`Mssql not support unique index at table variant.`);
    //     }
    //     return "";
    //   }),
    // ].join(",\n")}

    // )`;
  }

  get translator(): StandardTranslator {
    return defaultTranslator;
  }

  constructor(options: MssqlCompileOptions) {
    super(Object.assign({}, DefaultCompilerOptions, options));
  }

  compileType(type: DbType): string {
    return dbTypeToSql(type);
  }

  protected compileDate(date: Date) {
    const str = super.compileDate(date);
    return `CONVERT(DATETIMEOFFSET(7), ${str})`;
  }

  protected compileOffsetLimit(
    select: Select<any>,
    params: Set<Parameter>
  ): string {
    let sql = '';
    if (select.$offset === undefined && select.$limit === undefined) return sql;
    if (!select.$sorts) {
      select.orderBy(1);
      sql += ' ORDER BY 1';
    }
    sql += ` OFFSET ${select.$offset || 0} ROWS`;
    if (typeof select.$limit === 'number') {
      sql += ` FETCH NEXT ${select.$limit} ROWS ONLY`;
    }
    return sql;
  }
  // compileColumn(col, params) {
  //   return `${this.quoted(col.name)} = ${this.compileExpression(col.$expr, params, col)}`
  // }
}
