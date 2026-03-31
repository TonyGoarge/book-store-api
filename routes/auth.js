const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {User,validateRegisterUser,validateLoginUser} = require("../models/User");
const bcrypt = require("bcryptjs");
/*
 * @desc Register New User
 * @route /api/auth/register
 * @method POST
 * @access Public
 */
router.post("/register", asyncHandler(async (req, res) => {
    const { error } = validateRegisterUser(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const user = await User.findOne({ email: req.body.email });
    if (user) {
        return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    const newUser = new User({
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
    });
    const result = await newUser.save();
    const token = user.generateToken();
    const {password, ...other} = result._doc;
    res.status(201).json({...other,token});
}));

/*
 * @desc Login User
 * @route /api/auth/login
 * @method POST
 * @access Public
 */
router.post("/login", asyncHandler(async (req, res) => {
    const { error } = validateLoginUser(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }
    const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
    }
    //   const token = jwt.sign({id: user._id , username: user.username},process.env.JWT_SECRET,{expiresIn:"90d"}) ; 
        const token = user.generateToken();

    const {password, ...other} = user._doc;
    res.status(201).json({...other,token});
}));
module.exports = router;