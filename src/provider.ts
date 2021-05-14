import mssql from "mssql";
import { doQuery } from "./query";
import { toMssqlIsolationLevel } from "./types";
import { MssqlCompiler } from "./compile";
import { CompileOptions, IDbProvider, ISOLATION_LEVEL, Parameter, Transaction } from "../../lubejs";

export class MssqlProvider implements IDbProvider {
  constructor(private _pool: mssql.ConnectionPool, options: CompileOptions) {
    this.compiler = new MssqlCompiler(options);
  }

  readonly compiler: MssqlCompiler;

  async query(sql: string, params: Parameter<any, string>[]) {
    const res = await doQuery(this._pool, sql, params, this.compiler.options);
    return res;
  }

  async beginTrans(isolationLevel: ISOLATION_LEVEL = ISOLATION_LEVEL.READ_COMMIT): Promise<Transaction> {
    const trans = this._pool.transaction();
    await trans.begin(toMssqlIsolationLevel(isolationLevel));
    return {
      async query(sql, params) {
        const res = await doQuery(trans, sql, params, this.compiler.options);
        return res;
      },
      async commit() {
        await trans.commit();
      },
      async rollback() {
        await trans.rollback();
      },
    };
  }

  /**
   * 关闭所有连接
   * @memberof Pool
   */
  async close() {
    await this._pool.close();
  }
}
