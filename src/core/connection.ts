import {
  Connection,
  ConnectOptions,
  DbProvider,
  ISOLATION_LEVEL,
  QueryResult,
  SqlCommand,
} from 'lubejs/core';
import {
  isolationLevelToTSQL,
  normalDatas,
  normalValue,
  prepareParameter,
} from './types';
import {
  config as MssqlConfig,
  Connection as MssqlConn,
  IResult,
} from '@jovercao/mssql';
import { MssqlSqlOptions } from './sqlifier';

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
    useUTC: false,
  } as MssqlConfig['options'],
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
    (mssqlOptions.options as any).connectTimeout = options.connectionTimeout;
  }
  if (options.requestTimeout) {
    (mssqlOptions.options as any).requestTimeout = options.requestTimeout;
  }

  if (options.encrypt) {
    (mssqlOptions.options as any).encrypt = options.encrypt;
  }

  if (options.useUTC !== undefined) {
    mssqlOptions.options.useUTC = options.useUTC;
  }
  return mssqlOptions;
}

export class MssqlConnection extends Connection {
  changeToSysdb(): Promise<void> {
    return this.changeDatabase('master');
  }

  constructor(provider: DbProvider, options: MssqlConnectOptions) {
    super(
      provider,
      Object.assign({ optimize: true, encrypt: false, useUTC: false }, options)
    );
  }

  private _connection?: MssqlConn;
  private _mssqlOptions?: MssqlConfig;

  public override readonly options!: MssqlConnectOptions;

  protected async doBeginTrans(isolationLevel: ISOLATION_LEVEL): Promise<void> {
    // await this._connection!.beginTrans(toMssqlIsolationLevel(isolationLevel));
    await this.runCommand(
      {
        sql: `SET TRANSACTION ISOLATION LEVEL ${isolationLevelToTSQL(
          isolationLevel
        )};BEGIN TRANSACTION;`,
      },
      true
    );
  }

  protected async createSavePoint(id: number): Promise<void> {
    await this.runCommand({ sql: 'SAVE TRANSACTION ___trans___' + id }, true);
  }

  protected async rollbackSavePoint(id: number): Promise<void> {
    await this.runCommand({ sql: 'ROLLBACK TRANSACTION ___trans___' + id }, true);
  }

  protected async doCommit(): Promise<void> {
    await this.runCommand({ sql: `COMMIT TRANSACTION` }, true);
    // return this._connection!.commit();
  }

  protected async doRollback(): Promise<void> {
    await this.runCommand({ sql: `ROLLBACK TRANSACTION` }, true);
    // return this._connection!.rollback();
  }

  protected doOpen(): Promise<void> {
    this._mssqlOptions = parseMssqlConfig(this.options);
    this._connection = new MssqlConn(this._mssqlOptions);
    return this._connection.open();
  }

  protected async doClose(): Promise<void> {
    await this._connection!.close();
    this._connection = undefined;
  }

  protected doShutdown(): void {
    this.close().finally();
  }

  /**
   * 获取数据库架构
   */
  getSchema(dbname?: string): any {
    throw new Error(
      'This is a orm use kind, Pls import the full node module `lubejs-mssql`.'
    );
  }

  protected async runCommand(
    { sql, params }: SqlCommand,
    batch?: boolean
  ): Promise<QueryResult<any, any, any>> {
    const request = this._connection!.request();
    if (params) {
      params.forEach((p) => {
        prepareParameter(request, p);
      });
    }
    let res: IResult<any>;
    try {
      const useBatch = batch === undefined ? !this.options.optimize! : batch;
      if (useBatch) {
        res = await request.batch(sql);
      } else {
        res = await request.query(sql);
      }
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
        if (p.name === this.sqlifier.options.returnParameterName) {
          result.returnValue = value;
        }
      });
    }
    if (res.recordsets) {
      result.rowsets = res.recordsets as any;
    }
    return result;
  }

  protected reset(): Promise<void> {
    if (!this.opened) {
      throw new Error(`The connection is not opened yet.`);
    }
    return this._connection!.reset();
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

  /**
   * 开启性能优化，默认会使用 sp_executesql 来执行语句
   * 但使用过程中可能会遇到问题，比如开启事物等
   */
  optimize?: boolean;
}
