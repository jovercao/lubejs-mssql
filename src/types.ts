import mssql from 'mssql'
import { DbType, ISOLATION_LEVEL } from "../../lubejs";

export function toMssqlType(type: DbType): mssql.ISqlType {
  switch(type.name) {
    case 'BINARY':
      return mssql.Binary();
    case 'BOOLEAN':
      return mssql.Bit();
    case 'DATE':
      return mssql.Date();
    case 'DATETIME':
      return mssql.DateTimeOffset();
    case 'FLOAT':
      return mssql.Real();
    case 'DOUBLE':
      return mssql.Float();
    case 'INT8':
      return mssql.TinyInt();
    case 'INT16':
      return mssql.SmallInt();
    case 'INT32':
      return mssql.Int();
    case 'INT64':
      return mssql.BigInt();
    case 'NUMERIC':
      return mssql.Numeric(type.precision, type.digit);
    case 'STRING':
      return mssql.VarChar(type.length);
    case 'UUID':
      return mssql.UniqueIdentifier();
    case 'ROWFLAG':
      return mssql.BigInt();
    case 'ARRAY':
    case 'OBJECT':
      return mssql.NVarChar(mssql.MAX);
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
