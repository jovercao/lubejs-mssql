import { doQuery } from './query';
import { MssqlConnectOptions, toMssqlIsolationLevel } from './types';
import { MssqlSqlUtil, MssqlStandardTranslator } from './sql-util';
import {
  DbProvider,
  ISOLATION_LEVEL,
  Parameter,
  Transaction,
  DatabaseSchema,
  MigrateBuilder,
  Lube,
  SqlBuilder,
  QueryResult,
} from 'lubejs';
import { loadDatabaseSchema } from './schema-loader';
import { MssqlMigrateBuilder } from './migrate-builder';
import { parseMssqlConfig } from './util';
import { db_name, schema_name } from './build-in';
import { config as MssqlConfig, IConnection, Connection } from '@jovercao/mssql';

export const DIALECT = 'mssql';

export const DefaultConnectOptions: MssqlConfig = {
  server: 'localhost',
  // 端口号
  port: 1433,
  options: {
    encrypt: false,
    trustedConnection: true,
    // 设置为不自动回滚
    abortTransactionOnError: false,
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

export class MssqlProvider implements DbProvider {
  constructor(public options: MssqlConnectOptions) {
    const translator = new MssqlStandardTranslator(this);
    this.sqlUtil = new MssqlSqlUtil(options.sqlOptions, translator);
  }

  getCurrentDatabase(): Promise<string> {
    return this.lube.queryScalar(SqlBuilder.select(db_name()));
  }

  async getDefaultSchema(database?: string): Promise<string> {
    const currentDatabase = await this.getCurrentDatabase();
    if (database && currentDatabase !== database) {
      await this.lube.query(SqlBuilder.use(database));
    }
    let defaultSchema: string
    try {
      defaultSchema = await this.lube.queryScalar(
        SqlBuilder.select(schema_name())
      );
    } finally {
      if (database && currentDatabase !== database) {
        await this.lube.query(SqlBuilder.use(currentDatabase));
      }
    }
    return defaultSchema;
  }

  private _connection?: IConnection;

  lube!: Lube;
  readonly sqlUtil: MssqlSqlUtil;
  private _migrateBuilder?: MssqlMigrateBuilder;

  get migrateBuilder(): MigrateBuilder {
    if (!this._migrateBuilder) {
      this._migrateBuilder = new MssqlMigrateBuilder(this);
    }
    return this._migrateBuilder;
  }

  dialect: string = DIALECT;

  async getSchema(dbname?: string): Promise<DatabaseSchema | undefined> {
    await this._autoOpen();
    return loadDatabaseSchema(this, dbname);
  }

  private async _autoOpen(): Promise<void> {
    if (!this.opened) {
      await this.open();
    }
  }

  async query(sql: string, params: Parameter<any, string>[]): Promise<QueryResult<any, any, any>> {
    await this._autoOpen();
    const res = await doQuery(
      this._connection!,
      sql,
      params,
      this.sqlUtil.options
    );
    return res;
  }

  async beginTrans(
    isolationLevel: ISOLATION_LEVEL = ISOLATION_LEVEL.READ_COMMIT
  ): Promise<Transaction> {
    await this._autoOpen();
    const trans = this._connection!.transaction();
    // const x = await this._pool!.acquire();
    // x.execSql(new tedious.Request('abc'));
    // x.on('end', () => {
    //   x
    // })
    let rolledBack = false;
    trans.on('rollback', () => {
      // emited with aborted === true
      rolledBack = true;
    });
    await trans.begin(toMssqlIsolationLevel(isolationLevel));
    return {
      query: async (sql, params) => {
        const res = await doQuery(trans, sql, params, this.sqlUtil.options);
        return res;
      },
      commit: async () => {
        await trans.commit();
      },
      rollback: async () => {
        // fix: 解决mssql库自动rollback导致重复调用rollback的bug
        if (!rolledBack) {
          await trans.rollback();
        }
      },
    };
  }

  get opened(): boolean {
    return !!this._connection;
  }

  changeDatabase(database: string | null): void {
    if (this.opened) {
      throw new Error(`Not allow change database when connection is opened.`);
    }
    if (this.mssqlOptions.database === database) {
      return;
    }
    // let opened = this.opened;
    // if (opened) {
    //   await this.close();
    // }
    this.mssqlOptions.database = database === null ? undefined : database;
    // if (opened) {
    //   await this.open();
    // }
  }

  /**
   * 关闭所有连接
   * @memberof Pool
   */
  async close(): Promise<void> {
    if (!this.opened) {
      throw new Error(`Connection pool is not opened yet.`);
    }
    try {
      await this._connection!.close();
    } catch (error) {
      console.log(error);
    }
    this._connection = undefined;
  }

  private _mssqlOptions?: MssqlConfig;
  private get mssqlOptions(): MssqlConfig {
    if (!this._mssqlOptions) {
      this._mssqlOptions = parseMssqlConfig(this.options);
    }
    return this._mssqlOptions;
  }

  _createConnection() {
    return new Connection(this.mssqlOptions);
  }

  async open(): Promise<void> {
    if (this._connection) {
      throw new Error(`Connection pool is opened.`);
    }
    const connection = this._createConnection();
    await connection.connect();
    this._connection = connection;
  }
}
