import mssql, { ISqlType, ISqlTypeFactory } from '@jovercao/mssql';
import {
  Binary,
  DbType,
  Decimal,
  isBinary,
  ISOLATION_LEVEL,
  Parameter,
  Raw,
  Scalar,
  Time,
  Uuid,
} from 'lubejs/core';
import {
  formatDate,
  formatDateTime,
  formatIsoDateTimeLocale,
  formatTime,
} from './date-format';

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
  switch (type.type) {
    case 'BINARY':
      return mssql.VarBinary(type.size === DbType.MAX ? mssql.MAX : type.size);
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
    case 'FLOAT32':
      return mssql.Real();
    case 'FLOAT64':
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
      return mssql.Decimal(type.precision, type.scale);
    case 'STRING':
      if (type.size === DbType.MAX) {
        return mssql.NVarChar(mssql.MAX);
      } else {
        return mssql.NVarChar(type.size);
      }
    case 'UUID':
      return mssql.UniqueIdentifier();
    case 'ROWFLAG':
      return mssql.BigInt();
    case 'JSON':
    case 'LIST':
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
  switch (type.type) {
    case 'STRING':
      return `VARCHAR(${type.size === DbType.MAX ? 'MAX' : type.size})`;
    case 'INT8':
      return 'TINYINT';
    case 'INT16':
      return 'SMALLINT';
    case 'INT32':
      return 'INT';
    case 'INT64':
      return 'BIGINT';
    case 'BINARY':
      return `VARBINARY(${type.size === 0 ? 'MAX' : type.size})`;
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
    case 'FLOAT32':
      return 'REAL';
    case 'FLOAT64':
      return 'FLOAT(53)';
    case 'DECIMAL':
      return `DECIMAL(${type.precision}, ${type.scale})`;
    case 'UUID':
      return 'UNIQUEIDENTIFIER';
    case 'JSON':
    case 'LIST':
      return 'NVARCHAR(MAX)';
    case 'ROWFLAG':
      return 'TIMESTAMP';
    default:
      throw new Error(`Unsupport data type ${type['type']}`);
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
  REAL: 'float32',
  FLOAT: 'float64',
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
  if (matched.groups!.max) {
    return Reflect.apply(dbTypeFactory as Function, DbType, [DbType.MAX]);
  }
  return Reflect.apply(dbTypeFactory as Function, DbType, [
    Number.parseInt(matched.groups!.p1),
    Number.parseInt(matched.groups!.p2),
  ]);
}

/**
 * 编译字面量
 */
export function sqlifyLiteral(value: Scalar, dbType?: DbType): string {
  if (value === undefined) {
    throw new Error(`Unspport db value undefined, pls use null instead it.`);
  }
  if (!dbType) {
    return literalToSql(value);
    // dbType = Literal.parseValueType(value);
  }
  if (value === null) {
    return 'NULL';
  }

  switch (dbType.type) {
    case 'STRING':
      return "N'" + (value as string).replace(/'/g, "''") + "'";
    case 'INT8':
      return `CAST(${value.toString()} AS TINYINT)`;
    case 'INT16':
      return `CAST(${value.toString()} AS SMALLINT)`;
    case 'INT32':
      return `CAST(${value.toString()} AS INT)`;
    case 'INT64':
      return `CAST(${value.toString()} AS BIGINT)`;
    case 'BOOLEAN':
      return `CAST(${value ? '1' : '0'} AS BIT)`;
    case 'DATE':
      return `CAST('${formatDate(value as Date)}' AS DATE)`;
    case 'TIME':
      return `CAST('${
        value instanceof Time ? value?.toString() : formatTime(value as Date)
      }' AS TIME)`;
    case 'DATETIME':
      return `CAST('${formatDateTime(value as Date)}' AS DATETIME)`;
    case 'DATETIMEOFFSET':
      return `CAST('${formatIsoDateTimeLocale(
        value as Date
      )}' AS DATETIMEOFFSET)`;
    case 'FLOAT32':
      return `CAST(${value.toString()} AS REAL)`;
    case 'FLOAT64':
      return `CAST(${value.toString()} AS FLOAT)`;
    case 'DECIMAL':
      return `CAST(${value.toString()} AS DECIMAL(${dbType.precision}, ${
        dbType.scale
      }))`;
    case 'ROWFLAG':
    case 'BINARY':
      return '0x' + Buffer.from(value as Binary).toString('hex');
    case 'UUID':
      return `CAST('${(value as Uuid).toString()}' AS UNIQUEIDENTIFIER)`;
    case 'JSON':
    case 'LIST':
      return "'" + JSON_TYPE_PATTERN + JSON.stringify(value) + "'";
  }
}

function literalToSql(value: Scalar): string {
  // 为方便JS，允许undefined进入，留给TS语法检查
  if (value === undefined) {
    throw new Error(`Unspport db value undefined, pls use null instead it.`);
  }
  if (value === null) {
    return 'NULL';
  }

  const type = typeof value;

  if (type === 'string') {
    return "N'" + (value as string).replace(/'/g, "''") + "'";
  }

  if (type === 'number' || type === 'bigint') {
    return (value as number | bigint).toString(10);
  }

  if (type === 'boolean') {
    return value ? '1' : '0';
  }

  if (value instanceof Date) {
    return "CAST('" + formatIsoDateTimeLocale(value) + "' AS DATETIMEOFFSET)";
  }

  if (value instanceof Uuid) {
    return "CAST('" + value.toString() + "' AS UNIQUEIDENTIFIER)";
  }

  if (value instanceof Time) {
    return "CAST('" + value.toString() + "' AS TIME)";
  }

  if (value instanceof Decimal) {
    return value.toString();
  }

  if (isBinary(value)) {
    return '0x' + Buffer.from(value).toString('hex');
  }

  // 添加JSON类型标记，以便序列化器识别该标记
  return "'" + JSON_TYPE_PATTERN + JSON.stringify(value) + "'";
}

/**
 * 使mssql返回的数据类型符合lubejs类
 */
export function normalDatas(datas: mssql.IRecordSet<any>): any[] {
  return datas.map((row) => {
    for (const [column, { type }] of Object.entries(datas.columns)) {
      row[column] = normalValue(row[column], type);
    }
  });
}

export function isSqlType(
  type: ISqlType | (() => mssql.ISqlType),
  expect: ISqlTypeFactory
): boolean {
  return type === expect || (type as ISqlType).type === expect;
}

export function prepareParameter(request: mssql.Request, p: Parameter) {
  let value: any = p.value;
  if (value !== undefined && value !== null) {
    switch (p.type.type) {
      case 'TIME':
        if (value instanceof Time) {
          const date = new Date(1970, 0);
          date.setHours(value.hours);
          date.setMinutes(value.minutes);
          date.setSeconds(value.seconds);
          date.setMilliseconds(value.milliSeconds);
          value = date;
        }
        break;
      case 'JSON':
      case 'LIST':
        value = JSON.stringify(value);
        break;
      case 'DECIMAL':
      case 'UUID':
        value = value.toString();
        break;
    }
  }

  const mssqlType: mssql.ISqlType = toMssqlType(p.type);
  if (p.direction === 'IN') {
    request.input(p.name, mssqlType, value);
  } else {
    if (!p.type) {
      throw new Error('输出参数必须指定参数类型！');
    }
    request.output(p.name, mssqlType, value);
  }
}
export const JSON_TYPE_PATTERN = '';

export function normalValue(
  value: any,
  type: ISqlType | (() => mssql.ISqlType)
): any {
  if (value === undefined || value === null) {
    return value;
  }
  if (isSqlType(type, mssql.NVarChar) || isSqlType(type, mssql.VarChar)) {
    // 如果可能是json，则尝试反序列化JSON对象{}
    if (
      // Json类型
      (value.startsWith(JSON_TYPE_PATTERN + '{') && value.endsWith('}')) ||
      // List类型
      (value.startsWith(JSON_TYPE_PATTERN + '[') && value.endsWith(']'))
    ) {
      try {
        return JSON.parse(value.substring(JSON_TYPE_PATTERN.length));
      } catch {
        return value;
      }
    }
  } else if (isSqlType(type, mssql.BigInt)) {
    return BigInt(value);
  } else if (isSqlType(type, mssql.Time)) {
    if (value instanceof Date) {
      return new Time(
        value.getHours(),
        value.getMinutes(),
        value.getSeconds(),
        value.getMilliseconds()
      );
    } else {
      return new Time(value);
    }
  } else if (isSqlType(type, mssql.Decimal) || isSqlType(type, mssql.Numeric)) {
    return new Decimal(value);
  } else if (isSqlType(type, mssql.UniqueIdentifier)) {
    return new Uuid(value);
  }
  return value;
}
