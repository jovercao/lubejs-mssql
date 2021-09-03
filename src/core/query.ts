import mssql from '@jovercao/mssql';
import {
  SqlOptions,
  Parameter,
  QueryResult,
  Scalar,
  Decimal,
  Uuid
} from 'lubejs';
import { toMssqlType } from './types';
import { Connection as MssqlConn } from '@jovercao/mssql'

export async function doQuery(
  conn: MssqlConn,
  sql: string,
  params: Parameter<Scalar, string>[] | undefined,
  options: SqlOptions
): Promise<QueryResult<any, any, any>> {
  const request = await conn.request();
  if (params) {
    params.forEach(
      ({ name, value, type, direction = 'INPUT' }) => {
        const mssqlType: mssql.ISqlType = toMssqlType(type);

        if (direction === 'INPUT') {
          if (type) {
            request.input(name, mssqlType, value);
          } else {
            request.input(name, value);
          }
        } else if (direction === 'OUTPUT') {
          if (!type) {
            throw new Error('输出参数必须指定参数类型！');
          }
          if (value === undefined) {
            request.output(name, mssqlType);
          } else {
            request.output(name, mssqlType, value);
          }
        }
      }
    );
  }
  let res: mssql.IResult<any>;
  try {
    res = await request.query(sql);
  } catch (ex) {
    await request.cancel();
    throw ex;
  }
  res.recordsets.forEach(recordset => normalDatas(recordset));
  const result: QueryResult<any, any, any> = {
    rows: res.recordset,
    rowsAffected: res.rowsAffected[0],
    output: res.output,
  };
  if (params) {
    Object.entries(res.output).forEach(([name, value]) => {
      const p = params.find(p => p.name === name)!;
      // 回写输出参数
      p.value = value as Scalar;
      if (p.name === options.returnParameterName) {
        result.returnValue = value;
      }
    });
  }
  if (res.recordsets) {
    result.rowsets = res.recordsets as any;
  }
  return result;
}

mssql.map.register(Number, mssql.BigInt);
mssql.map.register(Decimal, mssql.Decimal);
mssql.map.register(Uuid, mssql.UniqueIdentifier);

/**
 * mssql 的类型不足，在此处转换
 */
function normalDatas(datas: mssql.IRecordSet<any>): any[] {
  for (const [column, { type }] of Object.entries(datas.columns)) {
    // HACK 使用mssql私有属性 SqlType declaration
    const declare = Reflect.get(type, 'declaration')?.toLowerCase?.();
    if (!declare) {
      throw new Error(`Declare`)
    }

    if (declare === 'bigint') {
      for (const row of datas) {
        const value = row[column] as string;
        if (value !== undefined && value !== null) {
          row[column] = BigInt(row[column]);
        }
      }
    } else if (declare === 'decimal' || declare === 'numeric') {
      for (const row of datas) {
        const value = row[column] as string;
        if (value !== undefined && value !== null) {
          row[column] = new Decimal(row[column]);
        }
      }
    } else if (declare === 'uniqueidentifier') {
      for (const row of datas) {
        const value = row[column] as string;
        if (value !== undefined && value !== null) {
          row[column] = new Uuid(row[column]);
        }
      }
    }
  }
  Reflect.deleteProperty(datas, 'columns');
  return datas;
}
