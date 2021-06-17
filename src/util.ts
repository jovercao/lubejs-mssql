import { Name } from '../../lubejs';

// export function quoted(name: string): string {
//   return `[${name.replace(/\]/g, "]]")}]`;
// }

// export function namify(name: Name<string>): string {
//   if (typeof name === "string") return quoted(name);
//   return name
//     .reverse()
//     .map((node) => quoted(node))
//     .join(".");
// }

/**
 * 分组
 * @author jover Cao
 * @date 2019/11/28
 * @param {Object} array 数组
 * @param {Object} fn 分组依据函数
 */
export function groupBy<TItem, THeader>(
  array: TItem[],
  fn: (item: TItem) => THeader
): { header: THeader; list: TItem[] }[] {
  const groups = {};
  array.forEach(function (o) {
    const header = JSON.stringify(fn(o));
    groups[header] = groups[header] || [];
    groups[header].push(o);
  });

  return Object.keys(groups).map(function (group) {
    const header = JSON.parse(group);
    const list = groups[group];
    return {
      header,
      list,
    };
  });
}
