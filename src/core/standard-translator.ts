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
} from './build-in';
import {
  Binary,
  CompatiableObjectName,
  CompatibleExpression,
  Condition,
  DbType,
  Expression,
  Numeric,
  Scalar,
  SQL,
  StandardTranslator,
  Star,
  TsTypeOf,
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

  abs<T extends Numeric>(value: CompatibleExpression<T>): Expression<T> {
    return abs(value);
  }

  exp<T extends Numeric>(value: CompatibleExpression<T>): Expression<T> {
    return exp(value) as any;
  }

  ceil<T extends Numeric>(value: CompatibleExpression<T>): Expression<T> {
    return ceiling(value);
  }

  floor<T extends Numeric>(value: CompatibleExpression<T>): Expression<T> {
    return floor(value);
  }

  ln<T extends Numeric>(value: CompatibleExpression<T>): Expression<T> {
    return log10(value);
  }

  log<T extends Numeric>(value: CompatibleExpression<T>): Expression<T> {
    return log(value);
  }

  pi(): Expression<number> {
    return pi();
  }

  power<T extends Numeric>(
    a: CompatibleExpression<T>,
    b: CompatibleExpression<Numeric>
  ): Expression<T> {
    return power(a, b);
  }

  radians<T extends Numeric>(value: CompatibleExpression<T>): Expression<T> {
    return radians(value);
  }

  degrees<T extends Numeric>(value: CompatibleExpression<T>): Expression<T> {
    return degrees(value);
  }

  random(): Expression<number> {
    return rand();
  }

  round(
    value: CompatibleExpression<Numeric>,
    s: CompatibleExpression<Numeric>
  ): Expression<Numeric> {
    return round(value, s);
  }

  sign<T extends Numeric>(value: CompatibleExpression<T>): Expression<T> {
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

  nvl<T extends Scalar>(
    value: CompatibleExpression<T>,
    defaultValue: CompatibleExpression<T>
  ): Expression<T> {
    return isNull(value, defaultValue);
  }

  count(expr: Star | CompatibleExpression<Scalar>): Expression<number> {
    return count(expr);
  }

  avg(expr: CompatibleExpression<Numeric>): Expression<Numeric> {
    return avg(expr);
  }

  sum(expr: CompatibleExpression<Numeric>): Expression<Numeric> {
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

  /**
   *
   * @param date
   * @param seconds
   * @returns
   */
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

  existsTable(name: CompatiableObjectName): Condition {
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
    return SQL.exists(
      SQL.select(1)
        .from({
          schema: 'sys',
          name: 'tables',
        })
        .where(SQL.field('name').eq(database))
    );
  }

  existsView(name: CompatiableObjectName): Condition {
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

  existsFunction(name: CompatiableObjectName): Condition {
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

  existsProcedure(name: CompatiableObjectName): Condition {
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

  existsSequence(name: CompatiableObjectName): Condition {
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
}
