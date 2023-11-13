const User = require("../models/user");
const jwt = require("jsonwebtoken");
var { expressjwt } = require("express-jwt");
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.signup = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const user = new User(req.body);
    await user.save();
    user.salt = undefined;
    user.hashed_password = undefined;
    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ err: errorHandler(err) });
  }
};

exports.signin = (req, res) => {
  //find user based on email
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(400).json({
          error: "User with that mail does not exsist, Please signup",
        });
      }

      //email password match.
      //create authenticate method in user.

      if (!user.authenticate(password)) {
        return res.status(401).json({
          error: "Email and password do not match",
        });
      }

      //generate a signed token with user id and secret

      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

      //persist the token as (t) in cookie but u can use any name u want and with expiry date

      res.cookie("t", token, { expire: new Date() + 9999 });

      //return response with user and token to frontend client

      const { _id, name, email, role } = user;
      return res.json({ token, user: { _id, email, name, role } });
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    });
};

exports.signout = (req, res) => {
  res.clearCookie("t"), res.json({ message: "Signout Successfully" });
};

exports.requireSignin = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"], // added later
  userProperty: "auth",
});

exports.isAuth = (req, res, next) => {
  let user = req.profile && req.auth && req.profile._id == req.auth._id;

  if (!user) {
    return res.status(403).json({
      error: "Access Denied",
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role !== 1) {
    return res.status(403).json({
      error: "Admin resource! access denied",
    });
  }
  next();
};
