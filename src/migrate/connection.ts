import { DatabaseSchema, SQL } from 'lubejs';
import { MssqlConnection } from '../core/connection';
import { loadDatabaseSchema } from './schema-loader';

MssqlConnection.prototype.getSchema = async function (
  this: MssqlConnection,
  dbName?: string
): Promise<DatabaseSchema | undefined> {
  const currentDb = await this.getDatabaseName();
  if (dbName) {
    if (
      (await this.queryScalar(
        SQL.select(1).where(SQL.std.existsDatabase(dbName))
      )) !== 1
    ) {
      return undefined;
    }
    await this.query(SQL.use(dbName));
    try {
      return await loadDatabaseSchema(this);
    } finally {
      await this.query(SQL.use(currentDb));
    }
  }
  return await loadDatabaseSchema(this);
};
