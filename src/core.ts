export * from './core/build-in';
export * from './core/connection';
export * from './core/provider';
export * from './core/sql-util';
export * from './core/standard-translator';
export * from './core/types';
export * from './core/build-in';

import { DbProviderFactory, DbProvider, register } from 'lubejs';
import { DIALECT, MssqlDbProvider } from './core/provider';

/**
 * 连接数据库并返回含数据库连接池的Provider
 * @param config 连接选项
 */
export const driver: DbProviderFactory = function (): DbProvider {
  return new MssqlDbProvider();
};

driver.dialect = DIALECT;

export default driver;

register(DIALECT, driver);
