export type PageParams<
  TRouteParams = Record<string, string>,
  TQueryParams = Record<string, string | string[] | undefined>,
> = {
  params: TRouteParams
  searchParams?: TQueryParams
}
