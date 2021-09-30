import { Connection } from 'lubejs';
import { MssqlConnection, MssqlDbProvider } from '../core';
import { MssqlMigrateBuilder } from './migrate-builder';
import { MssqlSchemaLoader } from './schema-loader';

MssqlDbProvider.prototype.getMigrateBuilder = function () {
  return new MssqlMigrateBuilder(this);
};

MssqlDbProvider.prototype.getSchemaLoader = function (
  connection: MssqlConnection
): MssqlSchemaLoader {
  return new MssqlSchemaLoader(connection);
};
