import { ZodTypeAny } from 'zod'

export type PageParams<
  TRouteParams = Record<string, string>,
  TQueryParams = Record<string, string | string[] | undefined>,
> = {
  params: Promise<TRouteParams>
  searchParams?: Promise<TQueryParams>
}

/** Whether the two provided types are the same. */
export type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false

/** The provided object with all non-object values set to string. Applies recursively to nested objects. */
export type Stringified<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? Stringified<T[K]>
    : string
}

export type ZodObject<T extends Record<string, unknown>> = {
  [k in keyof T]?: ZodTypeAny
}

/** Removes readonly modifier from any properties of object type `T`. */
export type Writeable<T> = { -readonly [P in keyof T]: T[P] }

export type PrimitiveValue =
  | string
  | number
  | bigint
  | boolean
  | Record<any, any>

export type GenericValue = PrimitiveValue | PrimitiveValue[] | null | undefined

/** Commonly used to identify the request type/action of the form. */
export type FormMode = 'create' | 'update' | 'delete' | 'search'

export type IsArray<T> = T extends any[] ? true : false
