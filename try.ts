import mssql from '@jovercao/mssql';
import assert from 'assert';
import {
  formatDate,
  formatDateTime,
  formatIsoDateTimeLocale,
  formatIsoDateTimeUtc,
} from './src/core/date-format';
import { Time } from '../lubejs/dist/core';

async function datetimeTypeCast() {
  const conn = await mssql.connect({
    user: 'sa',
    password: '!crgd-2021',
    server: 'rancher.vm',
    database: 'Test',
    options: { trustedConnection: true, encrypt: false, useUTC: false },
  });

  const date = new Date(2020, 0, 1);
  await conn.query(`
if (exists(select object_id('DateTest')))
begin
    drop table DateTest
end
create Table DateTest
(
    fdate Date,
    fdatetime datetime,
    fsmalldatetime smalldatetime,
    fdatetimeoffsetlocal datetimeoffset,
    fdatetimeoffsetutc datetimeoffset
)
`);

  await conn.query('delete datetest');

  await conn.query(`insert into DateTest(fdate, fdatetime, fsmalldatetime, fdatetimeoffsetlocal, fdatetimeoffsetutc)
  values(
    CAST('${formatDate(date)}' as Date),
    CAST('${formatDateTime(date)}' as DateTime),
    CAST('${formatDateTime(date)}' as SmallDateTime),
    CAST('${formatIsoDateTimeLocale(date)}' as datetimeoffset),
    CAST('${formatIsoDateTimeUtc(date)}' as datetimeoffset)
  )`);

  const paramInsertReq = conn.request();

  paramInsertReq.input('fdate', mssql.Date, date);
  paramInsertReq.input('fdatetime', mssql.DateTime, date);
  paramInsertReq.input('fsmalldatetime', mssql.SmallDateTime, date);
  paramInsertReq.input('fdatetimeoffsetlocal', mssql.DateTimeOffset, date);
  paramInsertReq.input('fdatetimeoffsetutc', mssql.DateTimeOffset, date);

  await paramInsertReq.query(
    `insert into DateTest(fdate, fdatetime, fsmalldatetime, fdatetimeoffsetlocal, fdatetimeoffsetutc)
  values(
    @fdate,
    @fdatetime,
    @fsmalldatetime,
    @fdatetimeoffsetlocal,
    @fdatetimeoffsetutc
  )`
  );

  console.log((await conn.query('select * from datetest')).recordset);

  const x1 = await conn.query(`select d = CAST('${formatDate(date)}' as Date)`);
  console.log('sql date:', date, x1.recordset[0].d);

  const x2 = await conn.query(
    `select d = CAST('${formatDateTime(date)}' as DateTime)`
  );
  console.log('sql datetime:', date, x2.recordset[0].d);

  const x3 = await conn.query(
    `select d = CAST('${formatDateTime(date)}' as SmallDateTime)`
  );
  console.log('sql smalldatetime:', date, x3.recordset[0].d);

  const x4 = await conn.query(
    `select d = CAST('${formatIsoDateTimeUtc(date)}' as DateTimeOffset)`
  );
  console.log('sql datetimeoffset-utc:', date, x4.recordset[0].d);

  const x5 = await conn.query(
    `select d = CAST('${formatIsoDateTimeLocale(date)}' as DateTimeOffset)`
  );
  console.log('sql datetimeoffset-local:', date, x5.recordset[0].d);

  // assert(res.recordset[0].d.toISOString() === now.toISOString())

  const req2 = conn.request().input('p', mssql.DateTimeOffset(7), date);
  const res2 = await req2.query('select d = @p');
  console.log('parma datetimeoffset:', date, res2.recordset[0].d);

  const req3 = conn.request().input('p', mssql.Date(), date);
  const res3 = await req3.query('select d = @p');
  console.log('parma date:', date, res3.recordset[0].d);

  const req4 = conn.request().input('p', mssql.DateTime(), date);
  const res4 = await req4.query('select d = @p');
  console.log('parma datetime:', date, res4.recordset[0].d);

  const req5 = conn.request().input('p', mssql.SmallDateTime(), date);
  const res5 = await req5.query('select d = @p');
  console.log('parma smalldatetime:', date, res5.recordset[0].d);

  await conn.close();
}

async function mssqlTypeMapTest() {
  const conn = await mssql.connect({
    user: 'sa',
    password: '!crgd-2021',
    server: 'rancher.vm',
    database: 'Test',
    options: { trustedConnection: true, encrypt: false, useUTC: false },
  });

  // 事实证明此映射无效
  mssql.map.register(Time, mssql.Time);

  const time = new Date(1970, 0, 1, 12, 0, 0);
  const res = await conn.query`select t = ${time}`;
  console.log('time:', res.recordset[0].t);
  await conn.close();
}

(async () => {
  // await datetimeTypeCast();
  await mssqlTypeMapTest();
})();
