const assert = require('assert');
const mock = require('mockjs');
const _ = require('lodash');
const program = require('commander')

const { count, getDate } = require('..')
const { connect, table, select, insert, update, SQL, any, execute,
  variant, fn, sp, exists, SORT_DIRECTION, input, output } = require('../../lubejs');

program.option('-h, --host <host>', 'server name')
program.option('-u, --user <user>', 'server user')
program.option('-p, --password <password>', 'server pasword')
program.option('-P, --port <port>', 'server port')
program.option('-d, --database <database>', 'database name')

program.parse(process.argv)

describe('MSSQL TESTS', function () {
  this.timeout(0);
  let db;
  const driver = require('..')
  const dbConfig = {
    driver,
    user: program.user || 'sa',
    password: program.password,
    host: program.host || 'localhost',
    // instance: 'MSSQLSERVER',
    database: program.database || 'TEST',
    trustedConnection: program.user ? false : true,
    port: program.port && parseInt(program.port) || 1433,
    // 最小值
    poolMin: 0,
    // 最大值
    poolMax: 5,
    // 闲置连接关闭等待时间
    idelTimeout: 30000,
    // 连接超时时间
    connectTimeout: 15000,
    // 请求超时时间
    requestTimeout: 15000
  };

  console.log(dbConfig)

  const sqlLogs = true;

  before(async function () {
    db = await connect(dbConfig);
    if (sqlLogs) {
      db.on('command', (cmd) => {
        console.log('sql:', cmd.sql);
        if (cmd.params && cmd.params.length > 0) {
          console.log('params:', cmd.params);
        }
      });
    }
    // try {
    //   await db.query('drop function dosomething');
    //   await db.query('drop PROC doProc');
    // } finally {
    // }
    await db.query(`CREATE FUNCTION dosomething(
        @x int
    )
    RETURNS INT
    BEGIN
        return @x
    END`);

    await db.query(`CREATE PROC doProc(
      @i int,
      @o nvarchar(20) OUTPUT
    )
    AS
    BEGIN
      set @o = 'hello world'
      return @i
    END`);

    console.log('create table items')
    const createTable = `create table Items (
      FId INT IDENTITY(1,1) PRIMARY KEY,
      FName NVARCHAR(120),
      FAge INT,
      FSex BIT,
      FCreateDate DATETIME,
      Flag TIMESTAMP NOT NULL
    )`;
    await db.query(createTable);
  });

  after(async function () {

    console.log('drop table Items');
    await db.query('drop table Items');
    await db.query('drop function dosomething');
    await db.query('drop PROC doProc');
    db.close();
  });

  it('db.query(sql, { p1: value1, p2:value2 })', async function () {
    const rs1 = await db.query('select [Name] = @p1, [Age] = @p2', {
      p1: 'name',
      p2: '100'
    });
    console.log(rs1);
    assert(rs1.rows[0].Name === 'name');
  });

  it ('db.query(sqls: string[], ...params: JsConstant[])', async function() {
    const name = 'Jover';
    const rs2 = await db.query`select [Name] = ${name}, [Age] = ${19}`;
    assert(rs2.rows[0].Name === name);
  })

  it('db.insert(table, rows: object[])', async function () {
    const { rows } = mock.mock({
      // 属性 的值是一个数组，其中含有 1 到 10 个元素
      'rows|100': [{
        // 属性 id 是一个自增数，起始值为 1，每次增 1
        // 'FID|+1': 1,
        'FAge|18-60': 1,
        'FSex|0-1': false,
        FName: '@name',
        FCreateDate: new Date()
      }]
    });

    const lines = await db.insert('Items', rows);
    assert(lines === rows.length);
  });

  it('db.insert(table, rows: object[])', async function () {
    const { rows } = mock.mock({
      // 属性 的值是一个数组，其中含有 1 到 10 个元素
      'rows|100': [{
        // 属性 id 是一个自增数，起始值为 1，每次增 1
        // 'FID|+1': 1,
        'FAge|18-60': 1,
        'FSex|0-1': false,
        FName: '@name',
        FCreateDate: new Date()
      }]
    });

    const lines = await db.insert('Items', rows);
    assert(lines === rows.length);
  });

  it('insert statement', async function () {
    const row = mock.mock({
      // 属性 id 是一个自增数，起始值为 1，每次增 1
      // 'FID|+1': 10000,
      'FAge|18-60': 1,
      'FSex|0-1': false,
      FName: '@name',
      FCreateDate: new Date()
    });
    const sql = insert('Items').values(row);
    const { rowsAffected } = await db.query(sql);
    assert(rowsAffected === 1);

    const sql2 = select(variant('@IDENTITY').as('id'));
    const res2 = await db.query(sql2);
    assert(res2.rows[0].id > 0);
  });

  it('find', async function () {
    const item = await db.find('Items', {
      FID: 1
    });
    assert(item);
  });

  it('update', async function () {
    const lines = await db.update('Items', {
      FNAME: '冷蒙',
      FAGE: 21,
      FSEX: false
    }, {
      FID: 1
    });
    assert(lines === 1);
  });

  it('update statement', async function () {
    const a = table('items');
    const sql = update(a)
      .set({
        fname: '哈罗',
        fage: 100,
        fsex: true
      })
      .where(a.fid.eq(2));
    const { rowsAffected } = await db.query(sql);
    assert(rowsAffected === 1);
  });

  it('update statement -> join update', async function () {
    const a = table('items').as('a');
    const b = table('items').as('b');
    const sql = update(a)
      .set({
        fname: '哈罗',
        fage: 100,
        fsex: true
      })
      .from(a)
      .join(b, b.fid.eq(a.fid))
      .where(a.fid.eq(2));
    const { rowsAffected } = await db.query(sql);
    assert(rowsAffected === 1);
  });

  it('select', async function () {
    const rows = await db.select('Items', {
      where: {
        fid: [1, 10, 11, 12, 13, 14]
      },
      sorts: {
        fid: SORT_DIRECTION.ASC
      },
      offset: 0,
      limit: 1
    });
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].FName, '冷蒙');
    assert.strictEqual(rows[0].FSex, false);
  });

  it('db.query(sql: Select) -> GroupBy', async function () {
    const a = table('Items').as('a');
    const b = table('Items').as('b');

    const sql = select(
      SQL.case(a.fsex).when(true, '男').else('女').as('性别'),
      getDate().as('Now'),
      fn('dbo', 'dosomething')(100),
      // 子查询
      select(1).as('field'),
      a.fid.as('aid'),
      b.fid.as('bid')
    )
      .from(a)
      .join(b, a.fid.eq(b.fid))
      .where(exists(select(1)))
      .groupBy(a.fid, b.fid, a.fsex)
      .having(count(a.fid).gte(1))
      .offset(50)
      .limit(10)
      .orderBy(a.fid.asc());

    let { rows } = await db.query(sql);
    console.log(rows[0]);
    assert(_.isDate(rows[0].Now), '不是日期类型');
    assert(rows[0].aid === 51, '数据不是预期结果');
    assert(['男', '女'].includes(rows[0]['性别']), '性别不正确');
    assert(rows.length === 10, '查询到的数据不正确');

    const sql2 = select(a.fid, a.fsex).from(a).distinct();
    await db.query(sql2);

    const sql3 = select(count(any()).as('count')).from(a);
    rows = (await db.query(sql3)).rows;
    assert(rows[0].count > 0);
  });

  it('db.query(sql: Select)', async function () {
    const o = table('sysobjects').as('o');
    const p = table('sys', 'extended_properties').as('p');
    const sql = select(
      o.$id,
      o.$name,
      p.$value.as('desc'),
      input('inputValue', 1000).as('inputValue'))
    .from(o)
    .leftJoin(p, p.major_id.eq(o.id)
      .and(p.minor_id.eq(0))
      .and(p.class.eq(1))
      .and(p.$name.eq('MS_Description')))
    .where(o.$type.in('U', 'V'));
    const { rows } = await db.query(sql);
    assert(rows.length > 0);
  });

  it('db.select(table)', async () => {
    const rows = await db.select('Items');
    assert(_.isArray(rows));
  });

  it('db.trans -> rollback', async () => {
    const srcRows = await db.select('Items');
    try {
      await db.trans(async (executor, abort) => {
        let lines = await executor.delete('Items');
        assert(lines > 0);
        const row = {
          FNAME: '中华人民共和国',
          FAGE: 70,
          FSEX: false
        };
        lines = await executor.insert('Items', row);
        assert(lines > 0);

        const t = table('Items');
        const item = (await executor.query(select(t.any()).from(t).where(t.FId.eq(variant('@identity'))))).rows[0];
        assert.strictEqual(item.FName, row.FNAME);
        throw new Error('事务错误回滚测试');
      });
    } catch (ex) {
      console.log(ex)
      assert(ex.message === '事务错误回滚测试');
    }

    const rows2 = await db.select('Items');
    assert.deepStrictEqual(rows2, srcRows);
  });

  it('db.trans -> commit', async () => {
    await db.trans(async (executor) => {
      await executor.query('SET identity_insert [Items] ON');
      const lines = await executor.insert('Items', {
        // FId: 10000,
        FName: '添加测试',
        FSex: false,
        FAge: 18
      });
      assert(lines > 0);
      await executor.query('SET identity_insert [Items] OFF');
    });

    const rows = await db.select('Items');
    assert(rows.length > 0);
  });

  it('db.delete', async function () {
    const lines = await db.delete('Items');
    assert(lines >= 1);
  });

  it('db.query(sql: Execute)', async function () {
    const p2 = output('o', String);
    const sql = execute('doProc', [1, p2]);
    const res = await db.query(sql);

    console.log(res);
    assert(res.returnValue === 1);
    assert(p2.value === 'hello world');
  });

  it('db.execute(sp, [...args])', async function () {
    const p2 = output('o', 'NVARCHAR(MAX)');
    const res = await db.execute('doProc', [1, p2]);
    assert(res.returnValue === 1);
    assert(p2.value === 'hello world');
  });
});
