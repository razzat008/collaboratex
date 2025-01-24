import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  let token;
  if (req.headers.client === 'not-browser') {
    token = req.headers.Authorization;
  } else {
    token = req.cookies['Authorization'];
  }

  if (!token) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const userToken = token.split(' ')[1];
    const jwtVerified = jwt.verify(userToken, process.env.JWT_TOKEN_SECRET);
    if (jwtVerified) {
      req.user = jwtVerified;
      next();
    } else {
      throw new Error('error in the token');
    }
  } catch (error) {
    console.log(error.message);
  }
};

export default authenticateToken;
