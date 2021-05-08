import assert = require('assert')
import * as mock from 'mockjs'
import * as _ from 'lodash'
import * as program from 'commander'
import {
  count,
  IDENTITY,
  getDate,
  dateAdd,
  isNull,
  DATE_PART,
  min
} from '../src'
import {
  Lube,
  connect,
  table,
  field,
  select,
  insert,
  update,
  SQL,
  star,
  _ as any,
  execute,
  variant,
  makeFunc,
  proc,
  exists,
  SORT_DIRECTION,
  input,
  output,
  SortObject,
  Star,
  and,
  enclose,
  $case,
  value,
  or,
  convert,
  NamedSelect,
  $with,
  ConnectOptions
} from '../../lubejs'

interface IItem {
  FId: number
  FName: string
  FAge: number
  FSex: boolean
  FCreateDate: Date
  Flag: ArrayBuffer
}

// argv.option('-h, --host <host>', 'server name')
//   .option('-u, --user <user>', 'server user')
//   .option('-p, --password <password>', 'server pasword')
//   .option('-P, --port <port>', 'server port')
//   .option('-d, --database <database>', 'database name')

const argv: Record<string, string> = {}
let index = 0
while (index < process.argv.length) {
  const arg = process.argv[index]
  switch (arg) {
    case '-u':
    case '---user':
      argv.user = process.argv[++index]
      break
    case '-h':
    case '--host':
      argv.host = process.argv[++index]
      break
    case '-p':
    case '--password':
      argv.password = process.argv[++index]
      break
    case '-P':
    case '--port':
      argv.port = parseInt(process.argv[++index])
      break
    case '-d':
    case '--database':
      argv.database = process.argv[++index]
  }
  index++
}

describe('MSSQL TESTS', function () {
  this.timeout(0)
  let db: Lube
  const driver = require('..')
  const dbConfig = {
    driver,
    user: argv.user || 'sa',
    password: argv.password,
    host: argv.host || 'localhost',
    // instance: 'MSSQLSERVER',
    database: argv.database || 'TEST',
    trustedConnection: argv.user ? false : true,
    port: (argv.port && parseInt(argv.port)) || 1433,
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
  }

  const sqlLogs = true

  before(async function () {
    // db = await connect('mssql://sa:!crgd-2019@jover.wicp.net:2443/TEST?poolMin=0&poolMax=5&idelTimeout=30000&connectTimeout=15000&requestTimeout=15000');
    db = await connect(dbConfig)
    if (sqlLogs) {
      db.on('command', cmd => {
        console.debug('sql:', cmd.sql)
        if (cmd.params && cmd.params.length > 0) {
          console.debug(
            'params: {\n',
            cmd.params
              .map(p => `${p.name}: ${JSON.stringify(p.value)}`)
              .join(',\n') + '\n}'
          )
        }
      })
    }
    // try {
    //   await db.query('drop function dosomething');
    //   await db.query('drop PROC doProc');
    // } finally {
    // }
    await db.query`CREATE FUNCTION dosomething(
        @x int
    )
    RETURNS INT
    BEGIN
        return @x
    END`

    await db.query`CREATE PROC doProc(
      @i int,
      @o nvarchar(20) OUTPUT
    )
    AS
    BEGIN
      set @o = 'hello world'
      return @i
    END`

    await db.query`create table Items (
      FId INT IDENTITY(1,1) PRIMARY KEY,
      FName NVARCHAR(120),
      FAge INT,
      FSex BIT,
      FCreateDate DATETIME DEFAULT (GETDATE()),
      Flag TIMESTAMP NOT NULL
    )`
  })

  after(async function () {
    await db.query`drop table Items`
    await db.query`drop function dosomething`
    await db.query`drop PROC doProc`
    db.close()
  })

  it('db.query(sql, { p1: value1, p2:value2 })', async function () {
    const rs1 = await db.query('select [Name] = @p1, [Age] = @p2', {
      p1: 'name',
      p2: '100'
    })
    assert(rs1.rows[0].Name === 'name')
  })

  it('db.query(sqls: string[], ...params: JsConstant[])', async function () {
    const name = 'Jover'
    const rs2 = await db.query`select [Name] = ${name}, [Age] = ${19}`
    assert(rs2.rows[0].Name === name)
  })

  it('db.insert(table, fields: string[], rows: ValueObject[]) --超大数量INSERT', async function () {
    const { rows }: { rows: IItem[] } = mock.mock({
      // 属性 的值是一个数组，其中含有 1 到 10 个元素
      'rows|3001': [
        {
          // 属性 id 是一个自增数，起始值为 1，每次增 1
          // 'FID|+1': 1,
          'FAge|18-60': 1,
          'FSex|0-1': false,
          FName: '@name',
          FCreateDate: new Date()
        }
      ]
    })

    const lines = await db.insert('Items', rows)
    assert(lines === rows.length)
  })

  it('db.insert(table, rows: ValueObject)', async function () {
    const row = mock.mock({
      // 属性 id 是一个自增数，起始值为 1，每次增 1
      // 'FID|+1': 1,
      'FAge|18-60': 1,
      'FSex|0-1': false,
      FName: '@name',
      FCreateDate: new Date()
    })

    const lines = await db.insert('Items', row)
    assert(lines === 1)
  })

  it('db.insert(table, fields, rows: Expression[])', async function () {
    const lines = await db.insert(
      'Items',
      ['fage', 'fsex', 'fname'],
      [18, false, '李莉']
    )
    assert(lines === 1)
  })

  it('db.insert(table, fields, rows: Expression[][])', async function () {
    const lines = await db.insert(
      'Items',
      ['fage', 'fsex', 'fname'],
      [
        [18, false, '李莉'],
        [18, false, '王丽萍'],
        [18, true, '隔壁老王']
      ]
    )
    assert(lines === 3)
  })

  it('db.query($with(...))', async function () {
    const t = table<IItem>('Items').as('t')
    const sql = select(t._).from(t)
    const x = sql.as('x')
    sql.union(x)
    const d = $with(x)
      .select(min(x.FId))
      .from(x);
    const minId = await db.queryScalar(d);
    assert(minId >= 0)
  })

  it('db.insert(table, rows: Expression[])', async function () {
    let err: Error
    try {
      const lines = await db.insert('Items', [
        '李莉',
        18,
        false,
        new Date(),
        Buffer.from('abc')
      ])
      assert(lines === 1)
    } catch (e) {
      err = e
    }
    assert(
      err &&
      err.message ===
      'Cannot insert an explicit value into a timestamp column. Use INSERT with a column list to exclude the timestamp column, or insert a DEFAULT into the timestamp column.',
      '因为Flag字段原因，该语句必须报错，否则是不正常的'
    )
  })

  it('db.insert(table, fields, rows: Expression[][])', async function () {
    const lines = await db.insert<IItem>(
      'Items',
      ['FName', 'FAge', 'FSex', 'FCreateDate'],
      [
        ['李莉', 18, false, new Date()],
        ['王丽萍', 18, false, new Date()],
        ['隔壁老王', 18, true, new Date()]
      ]
    )
    assert(lines === 3)
  })

  it('db.query(sql: Insert) => @@IDENTITY', async function () {
    const row = mock.mock({
      // 属性 id 是一个自增数，起始值为 1，每次增 1
      // 'FID|+1': 10000,
      'FAge|18-60': 1,
      'FSex|0-1': false,
      FName: '@name',
      FCreateDate: new Date()
    })
    const t = table<IItem>('Items')
    const sql = insert(t).values(row)
    const { rowsAffected } = await db.query(sql)
    assert(rowsAffected === 1)
    const sql2 = select<IItem>(any)
      .from('Items')
      .where(field('fid').eq(IDENTITY))
    const res2 = await db.query(sql2)
    assert(res2.rows.length > 0)
  })

  it('db.find(condition: WhereObject)', async function () {
    const item = await db.find<IItem>('Items', {
      FId: 1
    })
    assert(item)
  })

  it('update(rowset, ...)', async function () {
    const rowset = table<IItem>('Items').as('__t__')

    const lines = await db.update(
      rowset,
      {
        FName: '王宝强',
        FAge: 35,
        FSex: false
      },
      {
        FId: 1
      }
    )
    // const lines = await db.update<any>(
    //   "Items",
    //   {
    //     FNAME: "冷蒙",
    //     FAGE: 21,
    //     FSEX: false,
    //   },
    //   {
    //     FID: 1,
    //   }
    // );
    assert(lines === 1)
  })

  it('update(string, ...)', async function () {
    const lines = await db.update<any>(
      'Items',
      {
        FNAME: '冷蒙',
        FAGE: 21,
        FSEX: false
      },
      {
        FID: 1
      }
    )
    assert(lines === 1)
  })

  it('update statement', async function () {
    const a = table<IItem>('items')
    const sql = update(a)
      .set({
        FName: '哈罗',
        FAge: 100,
        FSex: true
      })
      .where(a.FId.eq(2))
    const { rowsAffected } = await db.query(sql)
    assert(rowsAffected === 1)
  })

  it('update statement -> join update', async function () {
    const a = table<IItem>('items').as('a')
    const b = table<IItem>('items').as('b')
    const sql = update(a)
      .set({
        FName: '哈罗',
        FAge: 100,
        FSex: true
      })
      .from(a)
      .join(b, b.FId.eq(a.FId))
      .where(a.FId.eq(2))
    const { rowsAffected } = await db.query(sql)
    assert(rowsAffected === 1)
  })

  it('select', async function () {
    const x: SortObject<IItem> = {
      FId: SORT_DIRECTION.ASC,
      FAge: SORT_DIRECTION.DESC
    }

    const rows = await db.select<IItem>('Items', {
      where: {
        FId: [1, 10, 11, 12, 13, 14]
      },
      sorts: {
        FId: SORT_DIRECTION.ASC,
        FAge: SORT_DIRECTION.DESC
      },
      offset: 0,
      limit: 1
    })
    assert.strictEqual(rows.length, 1)
    assert.strictEqual(rows[0].FName, '冷蒙')
    assert.strictEqual(rows[0].FSex, false)
  })

  it('db.query(sql: Select) -> GroupBy', async function () {
    const a = table<IItem>('Items').as('a')
    const b = table<IItem>('Items').as('b')

    const x = select<IItem>({
      FId: b.FId,
      FName: b.FName,
      FAge: b.FAge,
      FCreateDate: b.FCreateDate,
      FSex: b.FSex,
      Flag: b.Flag
    })
      .from(b)
      .as('x')

    const sql = select(
      SQL.case<string>(a.FSex)
        .when(true, '男')
        .else('女')
        .as('性别'),
      getDate().as('Now'),
      makeFunc<number, number>('scalar', ['dbo', 'dosomething'])(100),
      // 子查询
      select(enclose(1))
        .asValue()
        .as('field'),
      a.FId.as('aid'),
      b.FId.as('bid')
    )
      .from(a)
      .join(b, a.FId.eq(b.FId))
      .join(x, a.FId.eq(x.FId))
      .where(and(exists(select(1)), x.FId.in(select(b.FId).from(b))))
      .groupBy(a.FId, b.FId, a.FSex)
      .having(count(a.FId).gte(1))
      .offset(50)
      .limit(10)
      .orderBy(a.FId.asc())

    let { rows } = await db.query(sql)
    assert(_.isDate(rows[0].Now), '不是日期类型')
    assert(rows[0].aid === 51, '数据不是预期结果')
    assert(['男', '女'].includes(rows[0]['性别']), '性别不正确')
    assert(rows.length === 10, '查询到的数据不正确')

    const sql2 = select(a.FId, a.FSex)
      .from(a)
      .distinct()
    await db.query(sql2)
    const sql3 = select(count(star).as('count')).from(a)
    rows = (await db.query(sql3)).rows
    assert(rows[0].count > 0)
  })

  it('db.queryScalar(sql: Select)', async function () {
    const t = table<IItem>('Items').as('t')
    const sql = select(count(any)).from(t)

    const records = await db.queryScalar(sql)
    assert(records > 0)
  })

  it('db.query(sql: Select)', async function () {
    const o = table('sysobjects').as('o')
    const p = table(['sys', 'extended_properties']).as('p')
    const sql = select(
      o.field('id'),
      o.field('name'),
      p.value.as('desc'),
      input('inputValue', 1000).as('inputValue')
    )
      .from(o)
      .leftJoin(
        p,
        p.major_id
          .eq(o.id)
          .and(p.minor_id.eq(0))
          .and(p.class.eq(1))
          .and(p.name.eq('MS_Description'))
      )
      .where(o.type.in('U', 'V'))
    const { rows } = await db.query(sql)
    assert(rows.length > 0)
  })

  it('db.select(table)', async () => {
    const rows = await db.select('Items')
    assert(_.isArray(rows))
  })

  it('db.trans -> rollback', async () => {
    const srcRows = await db.select('Items')
    try {
      await db.trans(async (executor, abort) => {
        let lines = await executor.delete('Items')
        assert(lines > 0)
        const row = {
          FNAME: '中华人民共和国',
          FAGE: 70,
          FSEX: false
        }
        lines = await executor.insert('Items', [row])
        assert(lines > 0)

        const t = table<IItem>('Items')
        const item = (
          await executor.query<any>(
            select(t._)
              .from(t)
              .where(t.FId.eq(variant('@identity')))
          )
        ).rows[0]
        assert.strictEqual(item.FName, row.FNAME)
        throw new Error('事务错误回滚测试')
      })
    } catch (ex) {
      assert(ex.message === '事务错误回滚测试')
    }

    const rows2 = await db.select('Items')
    assert.deepStrictEqual(rows2, srcRows)
  })

  it('db.trans -> commit', async () => {
    await db.trans(async executor => {
      await executor.query('SET identity_insert [Items] ON')
      const lines = await executor.insert('Items', [
        {
          // FId: 10000,
          FName: '添加测试',
          FSex: false,
          FAge: 18
        }
      ])
      assert(lines > 0)
      await executor.query('SET identity_insert [Items] OFF')
    })

    const rows = await db.select('Items')
    assert(rows.length > 0)
  })

  it('db.delete', async function () {
    const lines = await db.delete('Items')
    assert(lines >= 1)
  })

  it('db.query(sql: Execute)', async function () {
    const p2 = output('o', 'string')
    const sql = execute('doProc', [1, p2])
    const res = await db.query(sql)

    assert(res.returnValue === 1)
    assert(p2.value === 'hello world')
  })

  it('db.execute(sp, [...args])', async function () {
    const p2 = output('o', 'string')
    const res = await db.execute('doProc', [1, p2])
    assert(res.returnValue === 1)
    assert(p2.value === 'hello world')
  })

  it('convert', async () => {
    const sql = select(value('2020-01-01T01:01:01+08:00').to('date'))
    const s = await db.queryScalar(sql)
    console.log(s)
  })

  it('AST.clone', async () => {
    const abc = table('abc')
    const abcCopied = abc.clone()

    assert.deepStrictEqual(abcCopied.abc.$name, ['abc', 'abc'])

    let offset: number = 0,
      limit: number = 50,
      providerId: number,
      producerId: number,
      productId: number,
      warehouseId: number,
      location: string,
      qualityStatus: number = null,
      unsalable: boolean,
      unsalableDay: number = 180,
      nearExpire: boolean,
      nearExpireDay: number = 180,
      keyword: string,
      sorts: [
        {
          column: 'quantity'
          direction: 'DESC'
        }
      ]

    unsalableDay = unsalableDay || 180
    nearExpireDay = nearExpireDay || 180

    const unsalableStock = table('stock').as('unsalableStock')
    const stock = select({
      id: unsalableStock.id,
      date: unsalableStock.date,
      code: unsalableStock.code,
      productId: unsalableStock.productId,
      quantity: unsalableStock.quantity,
      unit: unsalableStock.unit,
      providerId: unsalableStock.providerId,
      comefromId: unsalableStock.comefromId,
      warehouseId: unsalableStock.warehouseId,
      description: unsalableStock.description,
      amount: unsalableStock.quantity.mul(isNull(unsalableStock.costPrice, 0)),
      qualityStatus: unsalableStock.status,
      location: unsalableStock.location,
      isNearExpiry: $case()
        .when(
          dateAdd(DATE_PART.DAY, nearExpireDay, getDate()).gte(
            unsalableStock.expiryDate
          ),
          true
        )
        .else(false),
      isUnsalable: $case()
        .when(
          dateAdd(DATE_PART.DAY, unsalableDay, unsalableStock.date).gte(
            getDate()
          ),
          true
        )
        .else(false),
      belongId: unsalableStock.belongId
    })
      .from(unsalableStock)
      .as('stock')

    const product = table('product').as('product')
    const provider = table('company').as('provider')
    const comefrom = table('company').as('comefrom')
    const producer = table('company').as('producer')
    const warehouse = table('warehouse').as('warehouse')

    const detailSql = select({
      id: stock.id,
      date: stock.date,
      code: stock.code,
      productId: stock.productId,
      drugName: product.drugName,
      goodsName: product.goodsName,
      specs: product.specs,
      model: product.model,
      quantity: stock.quantity,
      unit: stock.unit,
      providerId: stock.providerId,
      providerName: provider.$('name'),
      providerCode: provider.code,
      comefromId: stock.comefromId,
      comefromCode: comefrom.code,
      comefromName: comefrom.$('name'),
      producerId: product.producerId,
      producerCode: producer.code,
      producerName: producer.$('name'),
      warehouseId: stock.warehouseId,
      warehouseCode: warehouse.code,
      warehouseName: warehouse.$('name'),
      description: stock.description,
      location: stock.location,
      amount: stock.amount,
      qualityStatus: stock.qualityStatus,
      isNearExpiry: stock.isNearExpiry,
      isUnsalable: stock.isUnsalable,
      belongId: stock.belongId
    })
      .from(stock)
      .join(product, product.id.eq(stock.productId))
      .leftJoin(producer, producer.id.eq(product.producerId))
      .leftJoin(provider, provider.id.eq(stock.providerId))
      .leftJoin(comefrom, comefrom.id.eq(stock.comefromId))
      .leftJoin(warehouse, warehouse.id.eq(stock.warehouseId))
      .where(
        and(
          stock.quantity.gt(0),
          or(value(productId).isNull(), stock.productId.eq(productId)),
          or(value(providerId).isNull(), stock.providerId.eq(providerId)),
          or(value(producerId).isNull(), product.producerId.eq(producerId)),
          or(value(warehouseId).isNull(), stock.warehouseId.eq(warehouseId)),
          or(isNull(location, '').eq(''), stock.location.like(location)),
          or(
            value(qualityStatus).isNull(),
            stock.qualityStatus.eq(qualityStatus)
          ),
          or(value(unsalable).isNull(), stock.isUnsalable.eq(unsalable)),
          or(value(nearExpire).isNull(), stock.isNearExpiry.eq(nearExpire))
        )
      )
    const countView = detailSql.as('countView')
    const countSql = select(count(countView.id)).from(countView)
    const copiedCountSql = countSql.clone()

    assert(countView !== copiedCountSql.$froms[0])
    assert.deepStrictEqual((copiedCountSql.$froms[0] as any).abc.$name, [
      'countView',
      'abc'
    ])

    const sql = db.compiler.compile(countSql)
    const copiedSql = db.compiler.compile(copiedCountSql)
    assert(
      sql.sql === copiedSql.sql,
      '克隆功能出现问题：' + sql.sql + '\n\n' + copiedSql.sql
    )
  })

  it('and/or 升级条件检查', function () {
    const sql = select(1).where(
      and(
        value(1).eq(1),
        value(1)
          .eq(1)
          .or(value(1).eq(1)),
        or(
          value(1).eq(1),
          value(1)
            .eq(1)
            .or(value(1).eq(1)),
          field('name').in([1, 2, 3, 4]),
          field('name').in(...[1, 2, 3, 4]),
          field('name').in(select(1))
        )
      )
    )

    const cmd = db.compiler.compile(sql)
    console.log(cmd.sql)
    assert(
      cmd.sql ===
      'SELECT 1 WHERE (1 = 1 AND (1 = 1 OR 1 = 1) AND (1 = 1 OR (1 = 1 OR 1 = 1) OR [name] IN (1,2,3,4) OR [name] IN (1,2,3,4) OR [name] IN (SELECT 1)))'
    )
  })
})
