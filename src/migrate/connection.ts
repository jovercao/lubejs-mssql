import { MssqlConnection } from "src/core/connection";
import { loadDatabaseSchema } from "./schema-loader";

MssqlConnection.prototype.getSchema = function() {
  return loadDatabaseSchema(this);
}
