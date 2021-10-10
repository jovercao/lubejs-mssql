import mssql, { ISqlType } from '@jovercao/mssql';
import { DbType, ISOLATION_LEVEL, Raw } from 'lubejs';

const strTypeMapps: Record<string, any> = {};
Object.entries(mssql.TYPES).forEach(([name, dbType]) => {
  strTypeMapps[name.toUpperCase()] = dbType;
});

const typeReg =
  /^\s*(?<type>\w+)\s*(?:\(\s*((?<max>max)|((?<p1>\d+)(\s*,\s*(?<p2>\d+))?))\s*\))?\s*$/i;

export function parseRawTypeToMssqlType(type: string): ISqlType {
  const matched = typeReg.exec(type);
  if (!matched) {
    throw new Error('Error mssql datat type: ' + type);
  }
  const sqlType = strTypeMapps[matched.groups!.type.toUpperCase()];
  if (!sqlType) {
    throw new Error('Unspport mssql data type:' + type);
  }

  if (matched.groups!.max) {
    return sqlType(mssql.MAX);
  }
  if (matched.groups!.p2 !== undefined) {
    return sqlType(
      Number.parseInt(matched.groups!.p1),
      Number.parseInt(matched.groups!.p2)
    );
  }
  return sqlType(Number.parseInt(matched.groups!.p1));
}

/**
 * 将类型转换为mssql库类型。
 */
export function toMssqlType(type: DbType): mssql.ISqlType {
  if (Raw.isRaw(type)) {
    return parseRawTypeToMssqlType(type.$sql);
  }
  switch (type.name) {
    case 'BINARY':
      return mssql.VarBinary();
    case 'BOOLEAN':
      return mssql.Bit();
    case 'DATE':
      return mssql.Date();
    case 'DATETIME':
      return mssql.DateTime();
    case 'DATETIMEOFFSET':
      return mssql.DateTimeOffset();
    case 'TIME':
      return mssql.Time(3);
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
    case 'DECIMAL':
      return mssql.Decimal(type.precision, type.digit);
    case 'STRING':
      if (type.length === DbType.MAX) {
        return mssql.VarChar(mssql.MAX);
      } else {
        return mssql.VarChar(type.length);
      }
    case 'UUID':
      return mssql.UniqueIdentifier();
    case 'ROWFLAG':
      return mssql.BigInt();
    case 'ARRAY':
    case 'OBJECT':
      return mssql.NVarChar(mssql.MAX);
    default:
      throw new Error(`Unsupport data type ${type['name']}`);
  }
}

const IsolationLevelMapps = {
  READ_COMMIT: mssql.ISOLATION_LEVEL.READ_COMMITTED,
  READ_UNCOMMIT: mssql.ISOLATION_LEVEL.READ_UNCOMMITTED,
  SERIALIZABLE: mssql.ISOLATION_LEVEL.SERIALIZABLE,
  REPEATABLE_READ: mssql.ISOLATION_LEVEL.REPEATABLE_READ,
  SNAPSHOT: mssql.ISOLATION_LEVEL.SNAPSHOT,
};

export function toMssqlIsolationLevel(level: ISOLATION_LEVEL): number {
  const result = IsolationLevelMapps[level];
  if (result === undefined) {
    throw new Error('不受支持的事务隔离级别：' + level);
  }
  return result;
}

export function sqlifyDbType(type: DbType | Raw): string {
  if (Raw.isRaw(type)) return type.$sql;
  switch (type.name) {
    case 'STRING':
      return `VARCHAR(${type.length === DbType.MAX ? 'MAX' : type.length})`;
    case 'INT8':
      return 'TINYINT';
    case 'INT16':
      return 'SMALLINT';
    case 'INT32':
      return 'INT';
    case 'INT64':
      return 'BIGINT';
    case 'BINARY':
      return `VARBINARY(${type.length === 0 ? 'MAX' : type.length})`;
    case 'BOOLEAN':
      return 'BIT';
    case 'DATE':
      return 'DATE';
    case 'DATETIME':
      return 'DATETIME';
    case 'DATETIMEOFFSET':
      return 'DATETIMEOFFSET(7)';
    case 'TIME':
      return 'TIME(3)';
    case 'FLOAT':
      return 'REAL';
    case 'DOUBLE':
      return 'FLOAT(53)';
    case 'DECIMAL':
      return `DECIMAL(${type.precision}, ${type.digit})`;
    case 'UUID':
      return 'UNIQUEIDENTIFIER';
    case 'OBJECT':
    case 'ARRAY':
      return 'NVARCHAR(MAX)';
    case 'ROWFLAG':
      return 'TIMESTAMP';
    default:
      throw new Error(`Unsupport data type ${type['name']}`);
  }
}

/**
 * 原始类型到DbType类型的映射
 */
const rawToDbTypeMap: Record<string, keyof typeof DbType> = {
  NCHAR: 'string',
  NVARCHAR: 'string',
  VARCHAR: 'string',
  CHAR: 'string',
  TEXT: 'string',
  NTEXT: 'string',
  INT: 'int32',
  BIGINT: 'int64',
  SMALLINT: 'int16',
  TINYINT: 'int8',
  DECIMAL: 'decimal',
  NUMERIC: 'decimal',
  FLOAT: 'float',
  REAL: 'double',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  DATETIME2: 'datetime',
  DATETIMEOFFSET: 'datetimeoffset',
  BIT: 'boolean',
  UNIQUEIDENTIFIER: 'uuid',
  BINARY: 'binary',
  VARBINARY: 'binary',
  IMAGE: 'binary',
  TIMESTAMP: 'rowflag',
  ROWVERSION: 'rowflag',
};

export function parseRawDbType(type: string): DbType {
  const matched = typeReg.exec(type);
  if (!matched) {
    throw new Error('Error mssql datat type: ' + type);
  }
  const dbTypeKey = rawToDbTypeMap[matched.groups!.type.toUpperCase()];
  if (!dbTypeKey) {
    throw new Error('Unknown or unspport mssql data type:' + type);
  }

  const dbTypeFactory = DbType[dbTypeKey];
  if (typeof dbTypeFactory === 'object') {
    return dbTypeFactory as DbType;
  }
  if (matched.groups!.max) {
    return Reflect.apply(dbTypeFactory as Function, DbType, [DbType.MAX]);
  }
  if (matched.groups!.p2 !== undefined) {
    return Reflect.apply(dbTypeFactory as Function, DbType, [
      Number.parseInt(matched.groups!.p1),
      Number.parseInt(matched.groups!.p2),
    ]);
  }
  return Reflect.apply(dbTypeFactory as Function, DbType, [
    Number.parseInt(matched.groups!.p1),
  ]);
}
