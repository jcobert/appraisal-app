import crypto from 'crypto'

export const generateUniqueToken = () => {
  return crypto.randomBytes(32).toString('hex')
}
