import 'mssql';

declare module 'mssql' {
  interface config {
    /**
     * 是否启用加密
     */
    encrypt?: boolean;
  }
}
