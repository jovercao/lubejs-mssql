import mssql from 'mssql'
import { ISOLATION_LEVEL } from "../../lubejs";

// const SCALAR_TYPE_MAPPING = new Map([
//   [String, mssql.NVarChar(mssql.MAX)],
//   [Number, mssql.Real(18)],
//   [Date, mssql.DateTimeOffset(8)],
//   [Boolean, mssql.Bit],
//   [ArrayBuffer, mssql.Binary],
//   [BigInt, mssql.BigInt]
// ])

const SCALAR_TYPE_MAPPING_STR = {
  string: mssql.NVarChar(mssql.MAX),
  number: mssql.Real(),
  date: mssql.DateTimeOffset(8),
  boolean: mssql.Bit,
  binary: mssql.Binary,
  bigint: mssql.BigInt
}

const TYPE_REG = /^\s*(?<type>\w+)\s*(?:\(\s*((?<max>max)|((?<p1>\d+)(\s*,\s*(?<p2>\d+))?))\s*\))?\s*$/i

const MSSQL_TYPES = {}

Object.entries(mssql.TYPES).forEach(([key, value]) => {
  MSSQL_TYPES[key.toUpperCase()] = value
})

/**
 * 将MSSQL字符串类型解析为mssql库的类型
 */
export function parseDbType(dbType) {
  const matched = TYPE_REG.exec(dbType)
  if (!matched) {
    throw new Error('错误的数据库类型名称：' + dbType)
  }
  const mssqlType = MSSQL_TYPES[matched.groups.type.toUpperCase()]
  if (!mssqlType) {
    throw new Error('不受支持的数据库类型：' + dbType)
  }
  if (matched.groups.max) {
    return mssqlType(mssql.MAX)
  }
  return mssqlType(matched.groups.p1, matched.groups.p2)
}

/**
 * 将 ScalarType 解析成mssql库的类型
 */
export function parseType(type) {
  if (!type) throw Error('类型不能为空！')
  const mssqlType = SCALAR_TYPE_MAPPING_STR[type]

  // const sqlType = SCALAR_TYPE_MAPPING.get(type)
  if (!mssqlType) {
    throw new Error('不受支持的类型：' + type)
  }
  return mssqlType
}

const IsolationLevelMapps = {
  [ISOLATION_LEVEL.READ_COMMIT]: mssql.ISOLATION_LEVEL.READ_COMMITTED,
  [ISOLATION_LEVEL.READ_UNCOMMIT]: mssql.ISOLATION_LEVEL.READ_UNCOMMITTED,
  [ISOLATION_LEVEL.SERIALIZABLE]: mssql.ISOLATION_LEVEL.SERIALIZABLE,
  [ISOLATION_LEVEL.REPEATABLE_READ]: mssql.ISOLATION_LEVEL.REPEATABLE_READ,
  [ISOLATION_LEVEL.SNAPSHOT]: mssql.ISOLATION_LEVEL.SNAPSHOT,
};

export function parseIsolationLevel(level: ISOLATION_LEVEL): number {
  const result = IsolationLevelMapps[level]
  if (result === undefined) {
    throw new Error('不受支持的事务隔离级别：' + level)
  }
  return result;
}
