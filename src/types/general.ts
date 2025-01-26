import { ZodTypeAny } from 'zod'

export type PageParams<
  TRouteParams = Record<string, string>,
  TQueryParams = Record<string, string | string[] | undefined>,
> = {
  params: Promise<TRouteParams>
  searchParams?: Promise<TQueryParams>
}

export type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false

export type Stringified<T extends Record<string, unknown>> = {
  [key in keyof T]: string
}

export type ZodObject<T extends Record<string, unknown>> = {
  [k in keyof T]: ZodTypeAny
}

/** Removes readonly modifier from any properties of object type `T`. */
export type Writeable<T> = { -readonly [P in keyof T]: T[P] }
