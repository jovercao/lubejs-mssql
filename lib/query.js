const { PARAMETER_DIRECTION } = require("../../lubejs");
const { parseDbType, parseType } = require("./types");

exports.query = async function doQuery(driver, sql, params = [], options) {
  const request = await driver.request();
  params.forEach(
    ({ name, value, type, dbType, direction = PARAMETER_DIRECTION.INPUT }) => {
      let mssqlType;
      // 优先使用dbType
      if (dbType) {
        mssqlType = parseDbType(type);
      } else if (type) {
        mssqlType = parseType(type);
      }

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
  const result = {
    rows: res.recordset,
    rowsAffected: res.rowsAffected[0],
    returnValue: res.returnValue,
    output: res.output,
  };
  if (res.recordsets) {
    // 仅MSSQL支持该属性，并不推荐使用
    result._recordsets = res.recordsets;
  }
  return result;
}
