export * from './core/build-in';
export * from './core/connection';
export * from './core/provider';
export * from './core/sqlifier';
export * from './core/virtual-translator';
export * from './core/types';

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
