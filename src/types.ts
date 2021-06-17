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

export function dbTypeToSql(type: DbType): string {
  switch (type.name) {
    case "STRING":
      return `VARCHAR(${type.length === DbType.MAX ? "MAX" : type.length})`;
    case "INT8":
      return "TINYINT";
    case "INT16":
      return "SMALLINT";
    case "INT32":
      return "INT";
    case "INT64":
      return "BIGINT";
    case "BINARY":
      return `VARBINARY(${type.length === 0 ? "MAX" : type.length})`;
    case "BOOLEAN":
      return "BIT";
    case "DATE":
      return "DATE";
    case "DATETIME":
      return "DATETIMEOFFSET(7)";
    case "FLOAT":
      return "REAL";
    case "DOUBLE":
      return "FLOAT(53)";
    case "NUMERIC":
      return `NUMERIC(${type.precision}, ${type.digit})`;
    case "UUID":
      return "UNIQUEIDENTIFIER";
    case "OBJECT":
    case "ARRAY":
      return "NVARCHAR(MAX)";
    case "ROWFLAG":
      return "TIMESTAMP";
    default:
      throw new Error(`Unsupport data type ${type["name"]}`);
  }
}
