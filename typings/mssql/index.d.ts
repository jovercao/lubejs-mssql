/// <reference types="node" />
import events = require("events");
import "mssql";

declare module "mssql" {
  export interface IOptions {
    /**
     * SQL SERVER遇到错误自动回滚
     */
    abortTransactionOnError?: boolean;
  }

  export interface IConnection {
    readonly connected: boolean;
    readonly connecting: boolean;
    query(command: string): Promise<IResult<any>>;
    query(
      strings: TemplateStringsArray,
      ...interpolations: any[]
    ): Promise<IResult<any>>;
    query<Entity>(command: string): Promise<IResult<Entity>>;
    query<Entity>(
      strings: TemplateStringsArray,
      ...interpolations: any[]
    ): Promise<IResult<Entity>>;
    query<Entity>(
      command: string,
      callback: (err?: Error, recordset?: IResult<Entity>) => void
    ): void;
    batch(batch: string): Promise<IResult<any>>;
    batch(
      strings: TemplateStringsArray,
      ...interpolations: any[]
    ): Promise<IResult<any>>;
    // batch(batch: string, callback: (err?: Error, recordset?: IResult<any>) => void): void;
    batch<Entity>(batch: string): Promise<IResult<Entity>>;
    batch<Entity>(
      strings: TemplateStringsArray,
      ...interpolations: any[]
    ): Promise<IResult<Entity>>;
    connect(): Promise<ConnectionPool>;
    // connect(callback: (err: any) => void): void;
    close(): Promise<void>;
    // close(callback: (err: any) => void): void;
    request(): Request;
    transaction(): Transaction;
  }

  export interface Connection extends IConnection, events.EventEmitter {
    readonly opened: boolean;
    readonly inTransaction: boolean;
    open(): Promise<void>;

    beginTrans(isolationLevel?: IIsolationLevel): Promise<Transaction>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
  }

  export interface ConnectionPool extends IConnection {
    connection(): Connection;
  }

  export interface ConnectionConstructor {
    new (config: config): Connection;
    new (): Connection;
    new (pool: ConnectionPool): Connection;

    readonly inTransaction: boolean;
  }

  export const Connection: ConnectionConstructor;
}
