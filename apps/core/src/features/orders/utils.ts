import { Property } from '@prisma/client'

export const getPropertyAddress = (
  property: Partial<Property> | undefined | null,
): { address: string; cityStateZip: string } => {
  if (!property) return { address: '', cityStateZip: '' }

  const { street, street2, city, state, zip } = property
  const address = `${street}${street2 ? ` ${street2}` : ''}`
  const cityState = `${city}${state ? `, ${state}` : ''}`
  const cityStateZip = `${cityState}${zip ? ` ${zip}` : ''}`

  return { address, cityStateZip }
}
