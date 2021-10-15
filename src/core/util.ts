import { sqlifyLiteral } from './types';

/**
 * 通过模板参数创建一个SQL命令
 */
export function formatSql(
  arr: TemplateStringsArray,
  ...paramValues: any[]
): string {
  let sql: string = arr[0];
  for (let i = 0; i < arr.length - 1; i++) {
    sql += sqlifyLiteral(paramValues[i]);
    sql += arr[i + 1];
  }
  return sql;
}

// function fixNum(num: number, digits: number): string {
//   return num.toString().padStart(digits, '0');
// }

// export function dateToString(date: Date): string {
//   return `${date.getFullYear()}-${fixNum(date.getMonth() + 1, 2)}-${fixNum(
//     date.getDate(),
//     2
//   )}T${fixNum(date.getHours(), 2)}:${fixNum(date.getMinutes(), 2)}:${fixNum(
//     date.getSeconds(),
//     2
//   )}.${fixNum(date.getMilliseconds(), 3)}${
//     date.getTimezoneOffset() > 0 ? '-' : '+'
//   }${fixNum(Math.abs(date.getTimezoneOffset() / 60), 2)}:00`;
// }

// function invalidType(dbType: DbType, value: Scalar) {
//   return new Error(`Invalid dbtype ${dbType.type} with value ${value}。`);
// }

// export function deprecate(msg: string): MethodDecorator | PropertyDecorator | ClassDecorator {
//   msg = 'lubejs-mssql————' + msg;
//   return function (
//     target: Object | Function,
//     key?: string | number | symbol,
//     propertyDescriptor?: PropertyDescriptor
//   ): TypedPropertyDescriptor<any> | void | Function {
//     // class
//     if (typeof target === 'function' && key === undefined) {
//       return class DeprecateClass extends (target as any) {
//         constructor(...args: any) {
//           super(...args);
//           console.warn(msg);
//         }
//       }
//     }

//     // method
//     if (typeof propertyDescriptor?.value === 'function') {
//       return {
//         ...propertyDescriptor,
//         value: nodeDeprecate(propertyDescriptor!.value!, msg);
//       }
//     } else {
//       if (propertyDescriptor) {
//         return {
//           configurable: propertyDescriptor.configurable,
//           enumerable: propertyDescriptor.enumerable,
//           writable?: propertyDescriptor.writable,
//           get: nodeDeprecate(propertyDescriptor?.get || function() { return this['___' + key] }, msg),
//           set: nodeDeprecate(propertyDescriptor?.set || function(value) { this['__' + key] = value}),
//         }
//       }
//     }
//   };
// }
