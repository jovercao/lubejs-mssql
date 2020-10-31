const mssql = require("mssql");
const { query: doQuery } = require("./query");
const { parseIsolationLevel } = require("./types")
const { MssqlCompiler } = require("./compiler");
const { ISOLATION_LEVEL } = require("../../lubejs");

class Provider {
  constructor(pool, options) {
    this._pool = pool;
    this.compiler = new MssqlCompiler(options);
  }

  async query(sql, params) {
    const res = await doQuery(this._pool, sql, params, this.compiler.options);
    return res;
  }

  async beginTrans(isolationLevel = ISOLATION_LEVEL.READ_COMMIT) {
    const trans = this._pool.transaction();
    await trans.begin(parseIsolationLevel(isolationLevel));
    return {
      async query(sql, params) {
        const res = await doQuery(trans, sql, params, this.compiler.options);
        return res;
      },
      async commit() {
        await trans.commit();
      },
      async rollback() {
        if (!trans._aborted) {
          await trans.rollback();
        }
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

module.exports = {
  Provider,
};
