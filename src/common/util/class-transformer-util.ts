import { TransformFnParams } from 'class-transformer';

type PredicateType = (params: TransformFnParams) => any;

export function undefineIf(
  predicate: PredicateType,
): (params: TransformFnParams) => any {
  const fun = (params: TransformFnParams) =>
    predicate(params) ? undefined : params.value;
  return fun;
}
