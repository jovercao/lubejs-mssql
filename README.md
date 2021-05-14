# LUBEJS-MSSQL

> Microsoft Sql Server driver for lubejs
> [lubjes document](https://github.com/jovercao/lubejs)

## install & usage

*install:*

```shell
npm install lubejs
npm install lubejs-mssql
```

*usage:*

```ts
import { connect } from 'lubejs'
import driver from 'lubejs-mssql'

async function querySomething() {
  const db = await connect({
    driver,
    host: '.',
    database: 'test-db',
    user: 'sa',
    password: 'password',
    port: 1433,
  });

  const res = await db.query`select * from table1`;
  console.log(res.rows);
}
```
