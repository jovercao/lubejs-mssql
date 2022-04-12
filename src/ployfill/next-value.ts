import { Expression, Scalar, XExpression, SQL } from "lubejs";

export function nextValue<T extends Scalar>(sequenceName: XExpression<string>): Expression<T> {
  return SQL.func({
    schema: 'lube',
    name: 'FN_NEXT_SEQUENCE_VALUE'
  }).invokeAsScalar(sequenceName);
}
