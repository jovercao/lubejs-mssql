import mssql from '@jovercao/mssql';
import assert from 'assert'

(async () => {
  const now = new Date();
  const conn = await mssql.connect({ user: 'sa', password: '!crgd-2021',server:'rancher.vm',database: 'Test', options: { trustedConnection: true, encrypt: false } });
  const res = await conn.query`select d = ${now}`;
  // assert(res.recordset[0].d.toISOString() === now.toISOString())

  console.log(res.recordset[0])


  const req = conn.request().input('p', mssql.DateTimeOffset(7), now);

  const res2 = await req.query('select d = @p');

  console.log(res2.recordset[0]);

  await conn.close();
})();

