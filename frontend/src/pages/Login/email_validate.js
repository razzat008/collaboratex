export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)*(ku\.edu\.np)$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address ending with ku.edu.np';
  }
  return '';
};

export default validateEmail;
