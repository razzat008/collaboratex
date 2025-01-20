import jwt from 'jsonwebtoken';
import User from '../model/user.js';
import { createHash, validateHash } from '../_helpers/hashFunction.js';

export const createUser = async (req, res) => { //siginup
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

export const authenticateUser = async (req, res) => { //logging in
  const { email, password } = req.body;

  try {

    const existingUser = await User.findOne({ email }).select('+password');
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: 'User does not exists!' });
    }
    const result = await validateHash(password, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials!' });
    }
    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
      },
      process.env.JWT_TOKEN_SECRET,
      {
        expiresIn: '8h',
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

// export const infoUser = async(req,res)=>{
//
// }
