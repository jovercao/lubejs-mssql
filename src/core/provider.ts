import { Connection, DbProvider } from 'lubejs/core';
import { MssqlConnection } from './connection';
import { MssqlSqlOptions, MssqlSqlifier } from './sqlifier';
import { MssqlVirtualTranslator } from './virtual-translator';
import { MssqlConnectOptions } from './connection';
import { SchemaComparator } from 'lubejs/migrate/schema-comparator';

export const DIALECT = 'mssql';

export class MssqlDbProvider implements DbProvider {
  constructor(sqlOptions?: MssqlSqlOptions) {
    this.sqlifier = new MssqlSqlifier(sqlOptions);
  }

  getSchemaComparator(): SchemaComparator {
    throw new Error(
      'This is a orm use kind, Pls import the full node module `lubejs-mssql`.'
    );
  }

  getMigrateBuilder(): any {
    throw new Error(
      'This is a orm use kind, Pls import the full node module `lubejs-mssql`.'
    );
  }

  readonly sqlifier: MssqlSqlifier;

  /**
   * 获取一个新的连接
   */
  getConnection(options: MssqlConnectOptions): Connection {
    return new MssqlConnection(this, options);
  }

  getSchemaLoader(connection: MssqlConnection): any {
    throw new Error(
      `SchemaLoader is the functional by full pack, pls use 'import 'lubejs' if want to use it.`
    );
  }

  readonly dialect: string = DIALECT;
}
