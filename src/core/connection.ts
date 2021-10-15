import {
  Connection,
  ConnectOptions,
  DbProvider,
  ISOLATION_LEVEL,
  QueryResult,
} from 'lubejs/core';
import { toMssqlIsolationLevel } from './types';
import {
  config as MssqlConfig,
  Connection as MssqlConn,
} from '@jovercao/mssql';
import { doQuery } from './query';
import { MssqlSqlOptions } from './sql-util';

const DefaultConnectOptions: MssqlConfig = {
  server: 'localhost',
  // 端口号
  port: 1433,
  options: {
    encrypt: false,
    // 信任连接，不检查SSL证书
    trustedConnection: true,
    // 设置为不自动回滚
    abortTransactionOnError: false,
    /**
     * 使用UTC存储日期，避免时区问题
     */
    useUTC: false
  },
  // 请求超时时间
  requestTimeout: 60000,
  // 连接超时时间
  connectionTimeout: 15000,
  // 开启JSON
  parseJSON: true,

  // // 严格模式
  // strict: true,
};

export function parseMssqlConfig(options: MssqlConnectOptions): MssqlConfig {
  const mssqlOptions: MssqlConfig = Object.assign({}, DefaultConnectOptions);
  // 避免对象污染
  mssqlOptions.options = Object.assign({}, DefaultConnectOptions.options);

  const keys = ['user', 'password', 'port', 'database'];
  keys.forEach((key) => {
    if (Reflect.has(options, key)) {
      Reflect.set(mssqlOptions, key, Reflect.get(options, key));
    }
  });
  mssqlOptions.server = options.host;
  // mssqlOptions.pool = mssqlOptions.pool || {};
  mssqlOptions.options = mssqlOptions.options || {};

  if (options.instance) {
    mssqlOptions.options.instanceName = options.instance;
  }

  // if (options.maxConnections !== undefined) {
  //   mssqlOptions.pool.max = options.maxConnections;
  // }
  // if (options.minConnections) {
  //   mssqlOptions.pool.min = options.minConnections;
  // }
  // if (options.recoveryConnection) {
  //   mssqlOptions.pool.idleTimeoutMillis = options.recoveryConnection;
  // }
  if (options.connectionTimeout) {
    mssqlOptions.options.connectTimeout = options.connectionTimeout;
  }
  if (options.requestTimeout) {
    mssqlOptions.options.requestTimeout = options.requestTimeout;
  }

  if (options.encrypt) {
    mssqlOptions.options.encrypt = options.encrypt;
  }

  if (options.useUTC !== undefined) {
    mssqlOptions.options.useUTC = options.useUTC;
  }
  return mssqlOptions;
}

export class MssqlConnection extends Connection {
  constructor(provider: DbProvider, options: MssqlConnectOptions) {
    super(provider, options);
    this._connection = new MssqlConn(this.mssqlOptions);
  }

  private _connection: MssqlConn;
  private _mssqlOptions?: MssqlConfig;
  private get mssqlOptions(): MssqlConfig {
    if (!this._mssqlOptions) {
      this._mssqlOptions = parseMssqlConfig(this.options);
    }
    return this._mssqlOptions;
  }

  public readonly options!: MssqlConnectOptions;

  async beginTrans(
    isolationLevel: ISOLATION_LEVEL = ISOLATION_LEVEL.READ_COMMIT
  ): Promise<void> {
    await this._autoOpen();
    await this._connection.beginTrans(toMssqlIsolationLevel(isolationLevel));
  }

  private _opened: boolean = false;

  private _openning: boolean = false;

  get opened(): boolean {
    return this._opened;
  }

  get openning(): boolean {
    return this._openning;
  }

  async open(): Promise<void> {
    if (this._opened) {
      throw new Error(`Then connection is opened.`);
    }
    if (this._openning) {
      throw new Error(`Then connection is openning now.`);
    }
    this._openning = true;
    try {
      await this._connection.open();
      this._opened = true;
    } finally {
      this._openning = false;
    }
  }

  async close(): Promise<void> {
    if (!this._opened) {
      throw new Error(`The connection is not opened.`);
    }
    this._opened = false;
    await this._connection.close();
  }

  async commit(): Promise<void> {
    await this._connection.commit();
  }

  async rollback(): Promise<void> {
    await this._connection.rollback();
  }

  get inTransaction(): boolean {
    return this._connection.inTransaction;
  }

  /**
   * 获取数据库架构
   */
  getSchema(dbname?: string): any {
    throw new Error(
      'This is a orm use kind, Pls import the full node module `lubejs-mssql`.'
    );
  }

  protected async doQuery(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<any, any, any>> {
    await this._autoOpen();
    return doQuery(
      this._connection,
      sql,
      params,
      this.provider.sqlUtil.options
    );
  }

  private async _autoOpen(): Promise<void> {
    if (!this.opened) {
      await this.open();
    }
  }
}

export interface MssqlConnectOptions extends ConnectOptions {
  /**
   * 实例名
   */
  instance?: string;
  /**
   * 是否启用加密
   */
  encrypt?: boolean;

  /**
   * 是否使用UTC时间，默认为true
   */
  useUTC?: boolean;

  sqlOptions?: MssqlSqlOptions;
}
