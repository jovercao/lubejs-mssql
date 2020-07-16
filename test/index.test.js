"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mock = require("mockjs");
const _ = require("lodash");
// import * as program from 'commander'
const __1 = require("..");
const lubejs_1 = require("../../lubejs");
// argv.option('-h, --host <host>', 'server name')
//   .option('-u, --user <user>', 'server user')
//   .option('-p, --password <password>', 'server pasword')
//   .option('-P, --port <port>', 'server port')
//   .option('-d, --database <database>', 'database name')
const argv = {};
let index = 0;
while (index < process.argv.length) {
    const arg = process.argv[index];
    switch (arg) {
        case '-u':
        case '---user':
            argv.user = process.argv[++index];
            break;
        case '-h':
        case '--host':
            argv.host = process.argv[++index];
            break;
        case '-p':
        case '--password':
            argv.password = process.argv[++index];
            break;
        case '-P':
        case '--port':
            argv.port = parseInt(process.argv[++index]);
            break;
        case '-d':
        case '--database':
            argv.database = process.argv[++index];
    }
    index++;
}
describe('MSSQL TESTS', function () {
    this.timeout(0);
    let db;
    const driver = require('..');
    const dbConfig = {
        driver,
        user: argv.user || 'sa',
        password: argv.password,
        host: argv.host || 'localhost',
        // instance: 'MSSQLSERVER',
        database: argv.database || 'TEST',
        trustedConnection: argv.user ? false : true,
        port: argv.port && parseInt(argv.port) || 1433,
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
    const sqlLogs = true;
    before(async function () {
        db = await lubejs_1.connect(dbConfig);
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
        await db.query `CREATE FUNCTION dosomething(
        @x int
    )
    RETURNS INT
    BEGIN
        return @x
    END`;
        await db.query `CREATE PROC doProc(
      @i int,
      @o nvarchar(20) OUTPUT
    )
    AS
    BEGIN
      set @o = 'hello world'
      return @i
    END`;
        await db.query `create table Items (
      FId INT IDENTITY(1,1) PRIMARY KEY,
      FName NVARCHAR(120),
      FAge INT,
      FSex BIT,
      FCreateDate DATETIME DEFAULT (GETDATE())
      --, Flag TIMESTAMP NOT NULL
    )`;
    });
    after(async function () {
        await db.query `drop table Items`;
        await db.query `drop function dosomething`;
        await db.query `drop PROC doProc`;
        db.close();
    });
    it('db.query(sql, { p1: value1, p2:value2 })', async function () {
        const rs1 = await db.query('select [Name] = @p1, [Age] = @p2', {
            p1: 'name',
            p2: '100'
        });
        assert(rs1.rows[0].Name === 'name');
    });
    it('db.query(sqls: string[], ...params: JsConstant[])', async function () {
        const name = 'Jover';
        const rs2 = await db.query `select [Name] = ${name}, [Age] = ${19}`;
        assert(rs2.rows[0].Name === name);
    });
    it('db.insert(table, fields: string[], rows: ValueObject[])', async function () {
        const { rows } = mock.mock({
            // 属性 的值是一个数组，其中含有 1 到 10 个元素
            'rows|3001': [{
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
    it('db.insert(table, rows: ValueObject)', async function () {
        const row = mock.mock({
            // 属性 id 是一个自增数，起始值为 1，每次增 1
            // 'FID|+1': 1,
            'FAge|18-60': 1,
            'FSex|0-1': false,
            FName: '@name',
            FCreateDate: new Date()
        });
        const lines = await db.insert('Items', row);
        assert(lines === 1);
    });
    it('db.insert(table, fields, rows: Expression[])', async function () {
        const lines = await db.insert('Items', ['fage', 'fsex', 'fname'], [18, false, '李莉']);
        assert(lines === 1);
    });
    it('db.insert(table, fields, rows: Expression[][])', async function () {
        const lines = await db.insert('Items', ['fage', 'fsex', 'fname'], [
            [18, false, '李莉'],
            [18, false, '王丽萍'],
            [18, true, '隔壁老王']
        ]);
        assert(lines === 1);
    });
    it('db.insert(table, rows: Expression[])', async function () {
        const lines = await db.insert('Items', ['李莉', 18, false, new Date()]);
        assert(lines === 1);
    });
    it('db.insert(table, rows: Expression[][])', async function () {
        const lines = await db.insert('Items', [
            ['李莉', 18, false, new Date()],
            ['王丽萍', 18, false, new Date()],
            ['隔壁老王', 18, true, new Date()]
        ]);
        assert(lines === 3);
    });
    it('db.query(sql: Insert) => @@IDENTITY', async function () {
        const row = mock.mock({
            // 属性 id 是一个自增数，起始值为 1，每次增 1
            // 'FID|+1': 10000,
            'FAge|18-60': 1,
            'FSex|0-1': false,
            FName: '@name',
            FCreateDate: new Date()
        });
        const t = lubejs_1.table('Items').as('t');
        const sql = lubejs_1.insert(t).values(row);
        const { rowsAffected } = await db.query(sql);
        assert(rowsAffected === 1);
        const sql2 = lubejs_1.select(lubejs_1.any()).from('Items').where(lubejs_1.field('fid').eq(__1.VARIANTS.IDENTITY));
        const res2 = await db.query(sql2);
        assert(res2.rows.length > 0);
    });
    it('db.find(condition: WhereObject)', async function () {
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
        const a = lubejs_1.table('items');
        const sql = lubejs_1.update(a)
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
        const a = lubejs_1.table('items').as('a');
        const b = lubejs_1.table('items').as('b');
        const sql = lubejs_1.update(a)
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
                fid: lubejs_1.SORT_DIRECTION.ASC
            },
            offset: 0,
            limit: 1
        });
        assert.strictEqual(rows.length, 1);
        assert.strictEqual(rows[0].FName, '冷蒙');
        assert.strictEqual(rows[0].FSex, false);
    });
    it('db.query(sql: Select) -> GroupBy', async function () {
        const a = lubejs_1.table('Items').as('a');
        const b = lubejs_1.table('Items').as('b');
        let x;
        let y = x;
        let z = x;
        let n = x;
        const sql = lubejs_1.select(lubejs_1.SQL.case(a.fsex).when(true, '男').else('女').as('性别'), __1.getDate().as('Now'), lubejs_1.fn('dbo', 'dosomething')(100), 
        // 子查询
        lubejs_1.select(1).as('field'), a.fid.as('aid'), b.fid.as('bid'))
            .from(a)
            .join(b, a.fid.eq(b.fid))
            .where(lubejs_1.exists(lubejs_1.select(1)))
            .groupBy(a.fid, b.fid, a.fsex)
            .having(__1.count(a.fid).gte(1))
            .offset(50)
            .limit(10)
            .orderBy(a.fid.asc());
        let { rows } = await db.query(sql);
        assert(_.isDate(rows[0].Now), '不是日期类型');
        assert(rows[0].aid === 51, '数据不是预期结果');
        assert(['男', '女'].includes(rows[0]['性别']), '性别不正确');
        assert(rows.length === 10, '查询到的数据不正确');
        const sql2 = lubejs_1.select(a.fid, a.fsex).from(a).distinct();
        await db.query(sql2);
        const sql3 = lubejs_1.select(__1.count(lubejs_1.any()).as('count')).from(a);
        rows = (await db.query(sql3)).rows;
        assert(rows[0].count > 0);
    });
    it('db.query(sql: Select)', async function () {
        const o = lubejs_1.table('sysobjects').as('o');
        const p = lubejs_1.table('sys', 'extended_properties').as('p');
        const sql = lubejs_1.select(o.$id, o.$name, p.$value.as('desc'), lubejs_1.input('inputValue', 1000).as('inputValue'))
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
                lines = await executor.insert('Items', [row]);
                assert(lines > 0);
                const t = lubejs_1.table('Items');
                const item = (await executor.query(lubejs_1.select(t.any()).from(t).where(t.FId.eq(lubejs_1.variant('@identity'))))).rows[0];
                assert.strictEqual(item.FName, row.FNAME);
                throw new Error('事务错误回滚测试');
            });
        }
        catch (ex) {
            assert(ex.message === '事务错误回滚测试');
        }
        const rows2 = await db.select('Items');
        assert.deepStrictEqual(rows2, srcRows);
    });
    it('db.trans -> commit', async () => {
        await db.trans(async (executor) => {
            await executor.query('SET identity_insert [Items] ON');
            const lines = await executor.insert('Items', [{
                    // FId: 10000,
                    FName: '添加测试',
                    FSex: false,
                    FAge: 18
                }]);
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
        const p2 = lubejs_1.output('o', String);
        const sql = lubejs_1.execute('doProc', [1, p2]);
        const res = await db.query(sql);
        assert(res.returnValue === 1);
        assert(p2.value === 'hello world');
    });
    it('db.execute(sp, [...args])', async function () {
        const p2 = lubejs_1.output('o', 'NVARCHAR(MAX)');
        const res = await db.execute('doProc', [1, p2]);
        assert(res.returnValue === 1);
        assert(p2.value === 'hello world');
    });
});
