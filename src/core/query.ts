import mssql, { Connection as MssqlConn } from '@jovercao/mssql';
import {
  SqlOptions,
  Parameter,
  QueryResult,
  Scalar,
  Decimal,
  Uuid,
  Time,
} from 'lubejs/core';
import { normalDatas, normalValue, prepareParameter } from './types';

export async function doQuery(
  conn: MssqlConn,
  sql: string,
  params: Parameter<Scalar, string>[] | undefined,
  options: SqlOptions
): Promise<QueryResult<any, any, any>> {
  const request = await conn.request();
  if (params) {
    params.forEach((p) => {
      prepareParameter(request, p);
    });
  }
  let res: mssql.IResult<any>;
  try {
    res = await request.query(sql);
  } catch (ex) {
    await request.cancel();
    throw ex;
  }
  res.recordsets.forEach((recordset) => normalDatas(recordset));
  const result: QueryResult<any, any, any> = {
    rows: res.recordset,
    rowsAffected: res.rowsAffected[0],
    output: res.output,
  };
  if (params) {
    Object.entries(res.output).forEach(([name, value]) => {
      const p = params.find((p) => p.name === name)!;
      value = normalValue(value, request.parameters[name].type);
      // 回写输出参数
      p.value = res.output[name] = value;
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
mssql.map.register(Time, mssql.Time);
