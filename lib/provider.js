const mssql = require('mssql')
const {
  PARAMETER_DIRECTION,
  ISOLATION_LEVEL,
  RETURN_VALUE_PARAMETER_NAME
} = require('lubejs')

const MssqlCompiler = require('./compiler')

const IsolationLevelMapps = {
  [ISOLATION_LEVEL.READ_COMMIT]: mssql.ISOLATION_LEVEL.READ_COMMITTED,
  [ISOLATION_LEVEL.READ_UNCOMMIT]: mssql.ISOLATION_LEVEL.READ_UNCOMMITTED,
  [ISOLATION_LEVEL.SERIALIZABLE]: mssql.ISOLATION_LEVEL.SERIALIZABLE,
  [ISOLATION_LEVEL.REPEATABLE_READ]: mssql.ISOLATION_LEVEL.REPEATABLE_READ,
  [ISOLATION_LEVEL.SNAPSHOT]: mssql.ISOLATION_LEVEL.SNAPSHOT
}

const JS_TYPE_MAPPS = new Map([
  [String, mssql.NVarChar(mssql.MAX)],
  [Number, mssql.Real(18)],
  [Date, mssql.DateTimeOffset(8)],
  [Boolean, mssql.Bit],
  [Buffer, mssql.Image],
  [BigInt, mssql.BigInt]
])

const STRING_TYPE_MAPPS = {}
Object.entries(mssql.TYPES).forEach(([name, dbType]) => {
  STRING_TYPE_MAPPS[name.toUpperCase()] = dbType
})

const TYPE_REG = /^\s*(?<type>\w+)\s*(?:\(\s*((?<max>max)|((?<p1>\d+)(\s*,\s*(?<p2>\d+))?))\s*\))?\s*$/i

const SQL_TYPES = Object.values(mssql.TYPES)

function parseStringType(type) {
  const matched = TYPE_REG.exec(type)
  if (!matched) {
    throw new Error('错误的数据库类型名称：' + type)
  }
  const sqlType = STRING_TYPE_MAPPS[matched.groups.type.toUpperCase()]
  if (!sqlType) {
    throw new Error('不受支持的数据库类型：' + type)
  }
  if (matched.groups.max) {
    return sqlType(mssql.MAX)
  }
  return sqlType(matched.groups.p1, matched.groups.p2)
}

function parseType(type) {
  if (!type) throw Error('类型不能为空！')
  // 如果本身就是类型，则不进行转换
  if (SQL_TYPES.includes(type) || SQL_TYPES.includes(type.type)) {
    return type
  }
  if (typeof type === 'string') {
    return parseStringType(type)
  }
  const sqlType = JS_TYPE_MAPPS.get(type)
  if (!sqlType) {
    throw new Error('不受支持的类型：' + type.name || type)
  }
  return sqlType
}

async function doQuery(driver, sql, params = []) {
  const request = await driver.request()
  params.forEach(({ name, value, dbType: type, direction = PARAMETER_DIRECTION.INPUT }) => {
    if (direction === PARAMETER_DIRECTION.INPUT) {
      if (type) {
        request.input(name, parseType(type), value)
      } else {
        request.input(name, value)
      }
    } else if (direction === PARAMETER_DIRECTION.OUTPUT) {
      if (!type) {
        throw new Error('输出参数必须指定参数类型！')
      }
      if (value === undefined) {
        request.output(name, parseType(type))
      } else {
        request.output(name, parseType(type), value)
      }
    }
  })
  let res
  try {
    res = await request.query(sql)
  } catch (ex) {
    await request.cancel()
    throw ex
  }
  Object.entries(res.output).forEach(([name, value]) => {
    const p = params.find(p => p.name === name)
    p.value = value
    if (p.name === RETURN_VALUE_PARAMETER_NAME) {
      res.returnValue = value
    }
  })
  const result = {
    rows: res.recordset,
    rowsAffected: res.rowsAffected[0],
    returnValue: res.returnValue,
    output: res.output
  }
  if (res.recordsets) {
    // 仅MSSQL支持该属性，并不推荐使用
    result._recordsets = res.recordsets
  }
  return result
}

class Provider {
  constructor(pool, options) {
    this._pool = pool
    this.parser = new MssqlCompiler(options)
  }

  async query(sql, params) {
    const res = await doQuery(this._pool, sql, params)
    return res
  }

  async beginTrans(isolationLevel = ISOLATION_LEVEL.READ_COMMIT) {
    const trans = this._pool.transaction()
    await trans.begin(IsolationLevelMapps[isolationLevel])
    return {
      async query(sql, params) {
        const res = await doQuery(trans, sql, params)
        return res
      },
      async commit() {
        await trans.commit()
      },
      async rollback() {
        if (!trans._aborted) {
          await trans.rollback()
        }
      }
    }
  }

  /**
  * 关闭所有连接
  * @memberof Pool
  */
  async close() {
    await this._pool.close()
  }
}

module.exports = {
  Provider
}
