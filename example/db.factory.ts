import { connect } from '../../lubejs/dist'
import { DB } from './orm'

export async function factory(): Promise<DB> {
  const lube = await connect({
    host: 'jover.rancher',
    database: 'TEST',
    user: 'sa',
    password: '!crgd-2019',
    port: 2433,
    maxConnections: 10,
    minConnections: 1,
    recoveryConnection: 30000,
  });
  return new DB(lube);
}
