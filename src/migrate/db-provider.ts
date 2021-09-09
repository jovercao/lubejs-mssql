import { MssqlDbProvider } from '../core/provider';
import { MssqlMigrateBuilder } from './migrate-builder';

MssqlDbProvider.prototype.getMigrateBuilder = function () {
  return new MssqlMigrateBuilder(this);
};
