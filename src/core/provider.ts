import { Connection, DbProvider } from 'lubejs/core';
import { MssqlConnection } from './connection';
import { MssqlSqlOptions, MssqlSqlUtil } from './sql-util';
import { MssqlStandardTranslator } from './standard-translator';
import { MssqlConnectOptions } from './connection';


export const DIALECT = 'mssql'

export class MssqlDbProvider implements DbProvider {
  constructor(sqlOptions?: MssqlSqlOptions) {
    this.sqlUtil = new MssqlSqlUtil(this, sqlOptions);
    this.stdTranslator = new MssqlStandardTranslator(this);
  }
  getMigrateBuilder(): any {
    throw new Error('This is a orm use kind, Pls import the full node module `lubejs-mssql`.');
  }

  readonly sqlUtil: MssqlSqlUtil;
  readonly stdTranslator: MssqlStandardTranslator;

  /**
   * 获取一个新的连接
   */
  getConnection(options: MssqlConnectOptions): Connection {
    return new MssqlConnection(this, options);
  }

  readonly dialect: string = DIALECT;
}
