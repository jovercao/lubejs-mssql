import { MssqlDbProvider } from 'src/core/provider';
import { MssqlMigrateBuilder } from './migrate-builder';

MssqlDbProvider.prototype.getMigrateBuilder = function () {
  return new MssqlMigrateBuilder(this);
};
