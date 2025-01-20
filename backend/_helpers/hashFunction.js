// import hash from 'bcryptjs';
import bcryptjs from 'bcryptjs';

export const createHash = (value, salt) => {
  return bcryptjs.hash(value, salt)
}

export const validateHash = (value, hashedValue) => {
  return bcryptjs.compare(value, hashedValue)
}
