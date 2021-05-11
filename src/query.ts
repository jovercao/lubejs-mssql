import { Request } from "mssql";
import { CompileOptions, Parameter, PARAMETER_DIRECTION, QueryResult } from "../../lubejs";
import { toMssqlType } from "./types";

export type IDriver = {
  request(): Request;
}

export  async function doQuery(driver: IDriver, sql: string, params: Parameter<any, string>[] = [], options: CompileOptions) {
  const request = await driver.request();
  params.forEach(
    ({ name, value, type, direction = PARAMETER_DIRECTION.INPUT }) => {
      let mssqlType;
      // 优先使用dbType

      mssqlType = toMssqlType(type);

      if (direction === PARAMETER_DIRECTION.INPUT) {
        if (type) {
          request.input(name, mssqlType, value);
        } else {
          request.input(name, value);
        }
      } else if (direction === PARAMETER_DIRECTION.OUTPUT) {
        if (!type) {
          throw new Error("输出参数必须指定参数类型！");
        }
        if (value === undefined) {
          request.output(name, mssqlType);
        } else {
          request.output(name, mssqlType, value);
        }
      }
    }
  );
  let res;
  try {
    res = await request.query(sql);
  } catch (ex) {
    await request.cancel();
    throw ex;
  }
  Object.entries(res.output).forEach(([name, value]) => {
    const p = params.find((p) => p.name === name);
    p.value = value;
    if (p.name === options.returnParameterName) {
      res.returnValue = value;
    }
  });
  const result: QueryResult<any, any, any> = {
    rows: res.recordset,
    rowsAffected: res.rowsAffected[0],
    returnValue: res.returnValue,
    output: res.output,
  };
  if (res.recordsets) {
    result.rowsets = res.recordsets;
  }
  return result;
}
