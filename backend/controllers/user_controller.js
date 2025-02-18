import jwt from 'jsonwebtoken';
import User from '../model/user.js';
import { createHash, validateHash } from '../_helpers/hash_function.js';

export const signup = async (req, res) => { //siginup
  const { name, email, username, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] });
    if (existingUser) {
      return res.status(401).json({ success: false, message: "User already exists with the same username or email." });
    }

    const hashedPassword = await createHash(password, 10);

    const newUser = new User({
      name: name,
      email: email,
      username: username,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => { //logging in
  const { email, password } = req.body;

  try {

    const existingUser = await User.findOne({ email }).select('+password');
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: 'User does not exists!' });
    }
    const result = await validateHash(password, existingUser.password); //check with the password from database
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials!' });
    }
    const token = jwt.sign(
      {
        email: existingUser.email,
        username: existingUser.username,
        userId: existingUser._id,
      },
      process.env.JWT_TOKEN_SECRET,
      {
        expiresIn: '10h',
      }
    );
    res.cookie('Authorization', 'Bearer ' + token, { //convention
      expire: new Date(Date.now() + 8 * 3600000),
      httpOnly: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
    }).json({ success: true, token, message: 'Authenticated sucessfully.' })

  } catch (error) {
    console.log(error)
  }
}

export const logout = async (req, res) => {
  console.log(req.body);
  res.clearCookie('Authorization').status(200).json({ sucess: true, message: 'Logged out sucessfully.' });
}

// export const infoUser = async(req,res)=>{
//
// }
