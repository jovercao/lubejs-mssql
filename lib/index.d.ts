import { Raw, ConnectOptions, Provider, UnsureExpressions, Invoke } from 'lubejs'

export function connect(config: ConnectOptions): Promise<Provider>

export default connect

type UnaryParameterInvoke = (expr: UnsureExpressions) => Invoke
type NoneParameterInvoke = () => Invoke
type DatePart = Raw

export const FUNCTIONS: {
  count: UnaryParameterInvoke,
  avg: UnaryParameterInvoke,
  sum: UnaryParameterInvoke,
  max: UnaryParameterInvoke,
  min: UnaryParameterInvoke,
  exp: UnaryParameterInvoke,
  round: (expr: UnsureExpressions, precision: UnsureExpressions) => Invoke,
  floor: UnaryParameterInvoke,
  sqrt: UnaryParameterInvoke,
  sine: UnaryParameterInvoke,
  power: UnaryParameterInvoke,
  nvl: UnaryParameterInvoke,
  stdev: UnaryParameterInvoke,
  square: UnaryParameterInvoke,
  dateName: UnaryParameterInvoke,
  datePart: UnaryParameterInvoke,
  isNull: (value: UnsureExpressions, default_value: UnsureExpressions) => Invoke,
  len: UnaryParameterInvoke,
  getDate: NoneParameterInvoke,
  getUtcDate: NoneParameterInvoke,
  date: NoneParameterInvoke,
  month: NoneParameterInvoke,
  year: NoneParameterInvoke,
  day: NoneParameterInvoke,
  dateAdd: (part: DatePart, increment: UnsureExpressions, date: UnsureExpressions) => Invoke,
  dateDiff: (part: DatePart, date: UnsureExpressions, value: UnsureExpressions) => Invoke,
  sysDateTime: NoneParameterInvoke,
  sysUtcDateTime: NoneParameterInvoke,
  charIndex: (pattern: UnsureExpressions, str: UnsureExpressions, startIndex?: UnsureExpressions) => Invoke,
  left: UnaryParameterInvoke,
  right: UnaryParameterInvoke,
  str: UnaryParameterInvoke,
  substring: (expr: UnsureExpressions, start: UnsureExpressions, length: UnsureExpressions) => Invoke,
  ascii: UnaryParameterInvoke,
  char: UnaryParameterInvoke,
  unicode: UnaryParameterInvoke,
  nchar: UnaryParameterInvoke,
  patIndex: (pattern: UnsureExpressions, str: UnsureExpressions) => Invoke,
  ltrim: UnaryParameterInvoke,
  rtrim: UnaryParameterInvoke,
  space: UnaryParameterInvoke,
  reverse: UnaryParameterInvoke,
  stuff: (expression_to_be_searched: UnsureExpressions, starting_position: UnsureExpressions, number_of_chars: UnsureExpressions, replacement_expression: UnsureExpressions) => Invoke,
  quotedName: UnaryParameterInvoke,
  lower: UnaryParameterInvoke,
  upper: UnaryParameterInvoke,
  replace: (expression_to_be_searched: UnsureExpressions, search_expression: UnsureExpressions, replacement_expression: UnsureExpressions) => Invoke,
  rand: NoneParameterInvoke,
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
export const round: (expr: UnsureExpressions, precision: UnsureExpressions) => Invoke
export const floor: UnaryParameterInvoke
export const sqrt: UnaryParameterInvoke
export const sine: UnaryParameterInvoke
export const power: UnaryParameterInvoke
export const nvl: UnaryParameterInvoke
export const stdev: UnaryParameterInvoke
export const square: UnaryParameterInvoke
export const dateName: UnaryParameterInvoke
export const datePart: UnaryParameterInvoke
export const isNull: (value: UnsureExpressions, default_value: UnsureExpressions) => Invoke
export const len: UnaryParameterInvoke
export const getDate: NoneParameterInvoke
export const getUtcDate: NoneParameterInvoke
export const date: NoneParameterInvoke
export const month: NoneParameterInvoke
export const year: NoneParameterInvoke
export const day: NoneParameterInvoke
export const dateAdd: (part: DatePart, increment: UnsureExpressions, date: UnsureExpressions) => Invoke
export const dateDiff: (part: DatePart, date: UnsureExpressions, value: UnsureExpressions) => Invoke
export const sysDateTime: NoneParameterInvoke
export const sysUtcDateTime: NoneParameterInvoke
export const charIndex: (pattern: UnsureExpressions, str: UnsureExpressions, startIndex?: UnsureExpressions) => Invoke
export const left: UnaryParameterInvoke
export const right: UnaryParameterInvoke
export const str: UnaryParameterInvoke
export const substring: (expr: UnsureExpressions, start: UnsureExpressions, length: UnsureExpressions) => Invoke
export const ascii: UnaryParameterInvoke
export const char: UnaryParameterInvoke
export const unicode: UnaryParameterInvoke
export const nchar: UnaryParameterInvoke
export const patIndex: (pattern: UnsureExpressions, str: UnsureExpressions) => Invoke
export const ltrim: UnaryParameterInvoke
export const rtrim: UnaryParameterInvoke
export const space: UnaryParameterInvoke
export const reverse: UnaryParameterInvoke
export const stuff: (expression_to_be_searched: UnsureExpressions, starting_position: UnsureExpressions, number_of_chars: UnsureExpressions, replacement_expression: UnsureExpressions) => Invoke
export const quotedName: UnaryParameterInvoke
export const lower: UnaryParameterInvoke
export const upper: UnaryParameterInvoke
export const replace: (expression_to_be_searched: UnsureExpressions, search_expression: UnsureExpressions, replacement_expression: UnsureExpressions) => Invoke
export const rand: NoneParameterInvoke
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
