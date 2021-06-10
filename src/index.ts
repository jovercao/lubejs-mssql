import sql from 'mssql'
import { MssqlProvider } from './provider'
import { DefaultCompilerOptions, MssqlCompileOptions } from './compile'
import {
  Driver,
  makeFunc,
  variant,
  ConnectOptions,
  IDbProvider,
  CompatibleExpression,
  Variant,
  Scalar,
  Expression,
  BuiltIn,
  builtIn,
  Binary
} from '../../lubejs'

const DefaultConnectOptions: sql.config = {
  server: 'localhost',
  // 端口号
  port: 1433,
  options: {
    encrypt: false,
    trustedConnection: true
  },
  // 请求超时时间
  requestTimeout: 60000,
  // 连接超时时间
  connectionTimeout: 15000,
  // 开启JSON
  parseJSON: true
  // // 严格模式
  // strict: true,
}

export interface MssqlConnectOptions extends ConnectOptions {
  /**
   * 实例名
   */
  instance?: string
  /**
   * 是否启用加密
   */
  encrypt?: boolean

  /**
   * 是否使用UTC时间，默认为true
   */
  useUTC?: boolean

  compileOptions?: MssqlCompileOptions
}

/**
 * 连接数据库并返回含数据库连接池的Provider
 * @param config 连接选项
 */
export const connect: Driver = async function (
  options: MssqlConnectOptions
): Promise<IDbProvider> {
  const mssqlOptions: sql.config = Object.assign({}, DefaultConnectOptions)
  const keys = ['user', 'password', 'port', 'database']
  keys.forEach(key => {
    if (options[key]) {
      mssqlOptions[key] = options[key]
    }
  })
  mssqlOptions.server = options.host
  mssqlOptions.pool = mssqlOptions.pool || {}
  mssqlOptions.options = mssqlOptions.options || {}

  if (options.instance) {
    mssqlOptions.options.instanceName = options.instance
  }

  if (options.maxConnections !== undefined) {
    mssqlOptions.pool.max = options.maxConnections
  }
  if (options.minConnections) {
    mssqlOptions.pool.min = options.minConnections
  }
  if (options.connectionTimeout) {
    mssqlOptions.options.connectTimeout = options.connectionTimeout
  }
  if (options.requestTimeout) {
    mssqlOptions.options.requestTimeout = options.requestTimeout
  }
  if (options.recoveryConnection) {
    mssqlOptions.pool.idleTimeoutMillis = options.recoveryConnection
  }
  if (options.encrypt) {
    mssqlOptions.options.encrypt = options.encrypt
  }

  if (options.useUTC !== undefined) {
    mssqlOptions.options.useUTC = options.useUTC;
  }
  const pool = new sql.ConnectionPool(mssqlOptions)
  await pool.connect()
  const compilerOptions = Object.assign({}, DefaultCompilerOptions, options.compileOptions)
  return new MssqlProvider(pool, compilerOptions)
}

export default connect

export * from './build-in'
