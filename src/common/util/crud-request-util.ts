import {
  CrudRequest,
  JoinOption,
  ParamsOptions,
  QueryFilterOption,
  RoutesOptions,
} from '@nestjsx/crud';
import {
  QueryFields,
  QueryFilter,
  QueryJoin,
  QuerySort,
  SConditionAND,
  SField,
  SFields,
} from '@nestjsx/crud-request';
import { ObjectLiteral } from 'typeorm';

export interface EntityCrudRequest<T> extends CrudRequest {
  parsed: {
    fields: QueryFields;
    paramsFilter: QueryFilter[];
    authPersist: ObjectLiteral;
    search:
      | SConditionAND
      | {
          [key in keyof T]: SField | Array<SFields | SConditionAND> | undefined;
        }
      | {
          [key: string]: SField | Array<SFields | SConditionAND> | undefined;
        };
    filter: QueryFilter[];
    or: QueryFilter[];
    join: QueryJoin[];
    sort: QuerySort[];
    limit: number;
    offset: number;
    page: number;
    cache: number;
    includeDeleted: number;
  };
  options: {
    query?: {
      allow?: Array<keyof T & string>;
      exclude?: Array<keyof T & string>;
      persist?: Array<keyof T & string>;
      filter?: QueryFilterOption;
      join?:
        | { [key in keyof T & string]?: JoinOption }
        | { [key: string]: JoinOption };
      sort?: QuerySort[];
      limit?: number;
      maxLimit?: number;
      cache?: number | false;
      alwaysPaginate?: boolean;
      softDelete?: boolean;
    };
    routes?: RoutesOptions;
    params?: ParamsOptions;
  };
}

export function makeEmptyCrudRequest(): CrudRequest {
  return {
    options: {
      params: {},
      query: {},
      routes: {
        createManyBase: {},
        createOneBase: {},
        deleteOneBase: {},
        getManyBase: {},
        getOneBase: {},
        recoverOneBase: {},
        replaceOneBase: {},
        updateOneBase: {},
      },
    },
    parsed: {
      fields: [],
      paramsFilter: [],
      authPersist: undefined,
      search: undefined,
      filter: [],
      or: [],
      join: [],
      sort: [],
      limit: undefined,
      offset: undefined,
      page: undefined,
      cache: undefined,
      includeDeleted: undefined,
    },
  };
}

export const makeEntityCrudRequest = <T>(): EntityCrudRequest<T> =>
  makeEmptyCrudRequest() as EntityCrudRequest<T>;
