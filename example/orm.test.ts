import 'tsconfig-paths/register';
import assert from 'assert';
import mock from 'mockjs';
import _ from 'lodash';
import { DB } from './orm';

import {
  Connection,
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
  exists,
  SORT_DIRECTION,
  input,
  output,
  SortObject,
  and,
  enclose,
  $case,
  value,
  or,
  $with,
  ConnectOptions,
  DbType,
  val,
  count,
  isNull,
  addDays,
  now,
  identityValue,
} from '../../lubejs';
import driver from '../src/index';
import path from 'path';
import fs from 'fs';

// argv.option('-h, --host <host>', 'server name')
//   .option('-u, --user <user>', 'server user')
//   .option('-p, --password <password>', 'server pasword')
//   .option('-P, --port <port>', 'server port')
//   .option('-d, --database <database>', 'database name')

const config = fs.existsSync(path.join(__dirname, './config.json'))
  ? require('./config.json')
  : {};
const argv: Record<string, any> = config;
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

describe.skip('MSSQL ORM TEST', function () {
  this.timeout(0);
  let db: Connection;
  let context: DB;
  const dbConfig: ConnectOptions = {
    driver,
    user: argv.user || 'sa',
    password: argv.password,
    host: argv.host || 'localhost',
    // instance: 'MSSQLSERVER',
    database: argv.database || 'TEST',
    port: (argv.port && parseInt(argv.port)) || 1433,
    // 最小值
    minConnections: 0,
    // 最大值
    maxConnections: 5,
    // 闲置连接关闭等待时间
    recoveryConnection: 30000,
    // 连接超时时间
    connectionTimeout: 15000,
    // 请求超时时间
    requestTimeout: 15000,
  };

  const sqlLogs = true;

  before(async () => {
    // db = await connect('mssql://sa:!crgd-2019@jover.wicp.net:2443/TEST?poolMin=0&poolMax=5&idelTimeout=30000&connectTimeout=15000&requestTimeout=15000');
    db = await connect(dbConfig);
    context = new DB(db);
    if (sqlLogs) {
      db.on('command', (cmd) => {
        console.debug('sql:', cmd.sql);
        if (cmd.params && cmd.params.length > 0) {
          console.debug(
            'params: {\n',
            cmd.params
              .map((p) => `${p.name}: ${JSON.stringify(p.value)}`)
              .join(',\n') + '\n}'
          );
        }
      });
    }
  });

  after(async () => {
    db.close();
  });
});
