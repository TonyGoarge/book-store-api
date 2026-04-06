const asyncHandler = require("express-async-handler");
const {Khadem,validateRegisterKhadem,validateLoginKhadem} = require("../models/Khadem");
const bcrypt = require("bcryptjs");


/*
 * @desc Register New Khadem
 * @route /api/khadem/register
 * @method POST
 * @access Public
 */
const createKhadem = asyncHandler(async (req, res) => {
    const { error } = validateRegisterKhadem(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const khadem = await Khadem.findOne({ email: req.body.email });
    if (khadem) {
        return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    const newKhadem = new Khadem({
        name: req.body.name,
        imageUrl: req.body.imageUrl,
        address: req.body.address,
        phone: req.body.phone,
        email: req.body.email,
        church: req.body.church,
        password: req.body.password,
        birthDate: req.body.birthDate,
    });
    const result = await newKhadem.save();
    const token = result.generateToken();
    const {password, ...other} = result._doc;
    res.status(201).json({...other,token});
})


/*
 * @desc Login Khadem
 * @route /api/khadem/login
 * @method POST
 * @access Public
 */
const loginKhadem = asyncHandler(async (req, res) => {
    const { error } = validateLoginKhadem(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    let khadem = await Khadem.findOne({ email: req.body.email });
    if (!khadem) {
        return res.status(400).json({ message: "Invalid email or password" });
    }
    const isPasswordMatch = await bcrypt.compare(req.body.password, khadem.password);
    if (!isPasswordMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
    }
    //   const token = jwt.sign({id: user._id , username: user.username},process.env.JWT_SECRET,{expiresIn:"90d"}) ; 
        const token = khadem.generateToken();

    const {password, ...other} = khadem._doc;
    res.status(201).json({...other,token});
})
    
module.exports = {createKhadem,loginKhadem};