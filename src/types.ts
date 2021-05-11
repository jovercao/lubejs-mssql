import mssql from 'mssql'
import { DbType, ISOLATION_LEVEL } from "../../lubejs";

export function toMssqlType(type: DbType): mssql.ISqlType {
  switch(type.name) {
    case 'binary':
      return mssql.Binary();
    case 'boolean':
      return mssql.Bit();
    case 'date':
      return mssql.Date();
    case 'datetime':
      return mssql.DateTimeOffset();
    case 'float':
      return mssql.Real();
    case 'double':
      return mssql.Float();
    case 'int8':
      return mssql.TinyInt();
    case 'int16':
      return mssql.SmallInt();
    case 'int32':
      return mssql.Int();
    case 'int64':
      return mssql.BigInt();
    case 'numeric':
      return mssql.Numeric(type.precision, type.digit);
    case 'string':
      return mssql.VarChar(type.length);
    case 'uuid':
      return mssql.UniqueIdentifier();
    default:
      throw new Error(`Unsupport data type ${type['name']}`)
  }
}

const IsolationLevelMapps = {
  [ISOLATION_LEVEL.READ_COMMIT]: mssql.ISOLATION_LEVEL.READ_COMMITTED,
  [ISOLATION_LEVEL.READ_UNCOMMIT]: mssql.ISOLATION_LEVEL.READ_UNCOMMITTED,
  [ISOLATION_LEVEL.SERIALIZABLE]: mssql.ISOLATION_LEVEL.SERIALIZABLE,
  [ISOLATION_LEVEL.REPEATABLE_READ]: mssql.ISOLATION_LEVEL.REPEATABLE_READ,
  [ISOLATION_LEVEL.SNAPSHOT]: mssql.ISOLATION_LEVEL.SNAPSHOT,
};

export function toMssqlIsolationLevel(level: ISOLATION_LEVEL): number {
  const result = IsolationLevelMapps[level]
  if (result === undefined) {
    throw new Error('不受支持的事务隔离级别：' + level)
  }
  return result;
}
