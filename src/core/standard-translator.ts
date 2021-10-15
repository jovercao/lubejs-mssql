import { MssqlSqlUtil } from './sql-util';
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
  object_id,
  db_name,
  schema_name,
  db_id,
} from './build-in';
import {
  Binary,
  XObjectName,
  XExpression,
  Condition,
  DbType,
  Expression,
  Numeric,
  Scalar,
  SQL,
  StandardTranslator,
  Star,
  ScalarFromDbType,
} from 'lubejs/core';
import { MssqlDbProvider } from './provider';

export class MssqlStandardTranslator implements StandardTranslator {
  get sqlUtil(): MssqlSqlUtil {
    return this.provider.sqlUtil;
  }

  constructor(private provider: MssqlDbProvider) {}

  currentDatabase(): Expression<string> {
    return db_name();
  }

  defaultSchema(): Expression<string> {
    return schema_name();
  }

  abs<T extends Numeric>(value: XExpression<T>): Expression<T> {
    return abs(value);
  }

  exp<T extends Numeric>(value: XExpression<T>): Expression<T> {
    return exp(value) as any;
  }

  ceil<T extends Numeric>(value: XExpression<T>): Expression<T> {
    return ceiling(value);
  }

  floor<T extends Numeric>(value: XExpression<T>): Expression<T> {
    return floor(value);
  }

  ln<T extends Numeric>(value: XExpression<T>): Expression<T> {
    return log10(value);
  }

  log<T extends Numeric>(value: XExpression<T>): Expression<T> {
    return log(value);
  }

  pi(): Expression<number> {
    return pi();
  }

  power<T extends Numeric>(
    a: XExpression<T>,
    b: XExpression<Numeric>
  ): Expression<T> {
    return power(a, b);
  }

  radians<T extends Numeric>(value: XExpression<T>): Expression<T> {
    return radians(value);
  }

  degrees<T extends Numeric>(value: XExpression<T>): Expression<T> {
    return degrees(value);
  }

  random(): Expression<number> {
    return rand();
  }

  round(
    value: XExpression<Numeric>,
    s: XExpression<Numeric>
  ): Expression<Numeric> {
    return round(value, s);
  }

  sign<T extends Numeric>(value: XExpression<T>): Expression<T> {
    return sign(value);
  }

  sqrt(value: XExpression<number>): Expression<number> {
    return sqrt(value);
  }

  cos(value: XExpression<number>): Expression<number> {
    return cos(value);
  }

  sin(value: XExpression<number>): Expression<number> {
    return sin(value);
  }

  tan(value: XExpression<number>): Expression<number> {
    return tan(value);
  }

  acos(value: XExpression<number>): Expression<number> {
    return acos(value);
  }

  asin(value: XExpression<number>): Expression<number> {
    return asin(value);
  }

  atan(value: XExpression<number>): Expression<number> {
    return atan(value);
  }

  atan2(value: XExpression<number>): Expression<number> {
    return atan2(value);
  }

  cot(value: XExpression<number>): Expression<number> {
    return cot(value);
  }

  nvl<T extends Scalar>(
    value: XExpression<T>,
    defaultValue: XExpression<T>
  ): Expression<T> {
    return isNull(value, defaultValue);
  }

  count(expr: Star | XExpression<Scalar>): Expression<number> {
    return count(expr);
  }

  avg(expr: XExpression<Numeric>): Expression<Numeric> {
    return avg(expr);
  }

  sum(expr: XExpression<Numeric>): Expression<Numeric> {
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
    table: XExpression<string>,
    column: XExpression<string>
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
    expr: XExpression,
    toType: T
  ): Expression<ScalarFromDbType<T>> {
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
    date: XExpression<Date>,
    timeZone: XExpression<string>
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
    date: XExpression<Date>,
    fmt: string
  ): Expression<string> {
    return format(date, fmt);
  }

  /**
   * 获取日期中的年份
   * @param date
   * @returns
   */
  yearOf(date: XExpression<Date>): Expression<number> {
    return datePart(DATE_PART.YEAR, date);
  }

  /**
   * 获取日期中的月份
   * @param date
   * @returns
   */
  monthOf(date: XExpression<Date>): Expression<number> {
    return datePart(DATE_PART.MONTH, date);
  }

  /**
   * 获取日期中的日
   * @param date
   * @returns
   */
  dayOf(date: XExpression<Date>): Expression<number> {
    return datePart(DATE_PART.DAY, date);
  }

  /**
   * 计算两个日期之间的天数，小数
   * @param start
   * @param end
   * @returns
   */
  daysBetween(
    start: XExpression<Date>,
    end: XExpression<Date>
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
    start: XExpression<Date>,
    end: XExpression<Date>
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
    start: XExpression<Date>,
    end: XExpression<Date>
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
    start: XExpression<Date>,
    end: XExpression<Date>
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
    start: XExpression<Date>,
    end: XExpression<Date>
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
    start: XExpression<Date>,
    end: XExpression<Date>
  ): Expression<number> {
    return dateDiff(DATE_PART.SECOND, start, end);
  }

  addDays(
    date: XExpression<Date>,
    days: XExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.DAY, days, date);
  }

  addMonths(
    date: XExpression<Date>,
    months: XExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.MONTH, months, date);
  }

  addYears(
    date: XExpression<Date>,
    years: XExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.YEAR, years, date);
  }

  addHours(
    date: XExpression<Date>,
    hours: XExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.HOUR, hours, date);
  }

  addMinutes(
    date: XExpression<Date>,
    minutes: XExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.MINUTE, minutes, date);
  }

  /**
   *
   * @param date
   * @param seconds
   * @returns
   */
  addSeconds(
    date: XExpression<Date>,
    seconds: XExpression<number>
  ): Expression<Date> {
    return dateAdd(DATE_PART.SECOND, seconds, date);
  }

  /**
   * 获取字符串长度
   * @param str
   * @returns
   */
  strlen(str: XExpression<string>): Expression<number> {
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
    str: XExpression<string>,
    start: XExpression<number>,
    length: XExpression<number>
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
    str: XExpression<string>,
    search: XExpression<string>,
    to: XExpression<string>
  ): Expression<string> {
    return replace(str, search, to);
  }

  /**
   * 删除字符串两侧空格
   * @param str
   * @returns
   */
  trim(str: XExpression<string>): Expression<string> {
    return ltrim(rtrim(str));
  }

  /**
   * 删除字符串右侧空格
   * @param str
   * @returns
   */
  trimEnd(str: XExpression<string>): Expression<string> {
    return rtrim(str);
  }

  /**
   * 转换成大写字母
   * @param str
   * @returns
   */
  upper(str: XExpression<string>): Expression<string> {
    return upper(str);
  }

  /**
   * 转换成小写字母
   * @param str
   * @returns
   */
  lower(str: XExpression<string>): Expression<string> {
    return lower(str);
  }

  /**
   * 查找一个
   * @param str
   * @param search
   * @returns
   */
  strpos(
    str: XExpression<string>,
    search: XExpression<string>,
    startAt?: XExpression<number>
  ): Expression<number> {
    return charIndex(search, str, startAt);
  }

  /**
   * 获取一个字符的ascii码
   * @param str 字符编码
   * @returns
   */
  ascii(str: XExpression<string>): Expression<number> {
    return ascii(str);
  }

  asciiChar(code: XExpression<number>): Expression<string> {
    return char(code);
  }

  unicode(str: XExpression<string>): Expression<number> {
    return unicode(str);
  }

  unicodeChar(code: XExpression<number>): Expression<string> {
    return char(code);
  }

  existsTable(name: XObjectName): Condition {
    return SQL.exists(
      SQL.select(1)
        .from({
          schema: 'sys',
          name: 'tables',
        })
        .where(
          SQL.field('object_id').eq(
            object_id(this.sqlUtil.sqlifyObjectName(name))
          )
        )
    );
  }

  existsDatabase(database: string): Condition {
    return db_id(database).isNotNull();
  }

  existsView(name: XObjectName): Condition {
    return SQL.exists(
      SQL.select(1)
        .from({
          schema: 'sys',
          name: 'views',
        })
        .where(
          SQL.field('object_id').eq(
            object_id(this.sqlUtil.sqlifyObjectName(name))
          )
        )
    );
  }

  existsFunction(name: XObjectName): Condition {
    const f = SQL.table('sys.objects').as('f');
    return SQL.exists(
      SQL.select(1)
        .from({
          schema: 'sys',
          name: 'objects',
        })
        .where(
          SQL.and(
            f.type.eq('FN'),
            SQL.field('object_id').eq(
              object_id(this.sqlUtil.sqlifyObjectName(name))
            )
          )
        )
    );
  }

  existsProcedure(name: XObjectName): Condition {
    return SQL.exists(
      SQL.select(1)
        .from({
          schema: 'sys',
          name: 'procedures',
        })
        .where(
          SQL.field('object_id').eq(
            object_id(this.sqlUtil.sqlifyObjectName(name))
          )
        )
    );
  }

  existsSequence(name: XObjectName): Condition {
    return SQL.exists(
      SQL.select(1)
        .from({
          schema: 'sys',
          name: 'sequences',
        })
        .where(
          SQL.field('object_id').eq(
            object_id(this.sqlUtil.sqlifyObjectName(name))
          )
        )
    );
  }

  sequenceNextValue<T extends Numeric>(
    sequenceName: XObjectName<string>
  ): Expression<T> {
    return SQL.raw(
      `NEXT VALUE FOR ${this.sqlUtil.sqlifyObjectName(sequenceName)}`
    );
  }
}
