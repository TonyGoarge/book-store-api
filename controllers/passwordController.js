
const asyncHandler = require("express-async-handler");
const {Khadem} = require("../models/Khadem");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
/**
 * @desc    Get forgot password view
 * @route   GET /forgot-password
 * @access  Public
 */
module.exports.getForgotPasswordView = asyncHandler((req, res) => {
    console.log("ffff");
    res.render("forgot-password");
});


// /**
//  * @desc    Send Forgot Password Link
//  * @route   POST /password/forgot-password
//  * @access  Public
//  */
// module.exports.sendForgotPasswordLink = asyncHandler(async (req, res) => {
//     console.log(req.body.email); 
//     const khadem = await Khadem.findOne({email: req.body.email});
//     if(!khadem){
//         return res.status(404).json({message: "Khadem not found"});
//     }
//     const secret = process.env.JWT_SECRET + khadem.password;
//     const token = jwt.sign({email: khadem.email , id: khadem._id},secret,{expiresIn:"10m"});

//     const link = `http://localhost:3000/password/reset-password/${khadem._id}/${token}`;

//    const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASSWORD
//     }
//    });

//    const mailOptions = {
//     from: process.env.EMAIL,
//     to: khadem.email,
//     subject: "Reset Password",
//     html: `<p>Click on the link to reset your password: <a href="${link}">${link}</a></p>`
//    };

//    transporter.sendMail(mailOptions, (err, info) => {
//     if(err){
//         console.log(err);
//         return res.status(500).json({message: "Error"});
//     }
//     console.log("Email sent: " + info.response);
//        res.render("link-send");

//    });
// });




exports.sendForgotPasswordLink = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  const khadem = await Khadem.findOne({ email });

  if (!khadem) {
    return res.status(404).json({
      message: "Khadem not found",
    });
  }

  const secret = process.env.JWT_SECRET + khadem.password;

  const token = jwt.sign(
    {
      id: khadem._id,
      email: khadem.email,
    },
    secret,
    {
      expiresIn: "10m",
    }
  );

  const resetLink = `${req.protocol}://${req.get(
    "host"
  )}/password/reset-password/${khadem._id}/${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: khadem.email,
    subject: "Reset Password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">
        Reset Password
      </a>
    `,
  });

  res.status(200).json({
    success: true,
    message: "Reset password link sent successfully check your email !!",
  });
});



/**
 * @desc    Get reset password View
 * @route   GET /reset-password/:id/:token
 * @access  Public
 */
module.exports.resetThePasswordView = asyncHandler(async (req, res) => {
    const khadem = await Khadem.findById(req.params.id);
    if(!khadem){
        return res.status(404).json({message: "Khadem not found"});
    }
    const secret = process.env.JWT_SECRET + khadem.password;
    try{
     jwt.verify(req.params.token,secret);
        res.render("reset-password",{email: khadem.email});
    }catch(error){
        console.log(error);
        res.json({message: "Error"});
        // return res.status(401).json({message: "Invalid token"});
    }
    
});
 

/**
 * @desc    Get reset password View
 * @route   Post /reset-password/:id/:token
 * @access  Public
 */
module.exports.getResetPasswordView = asyncHandler(async (req, res) => {
    const khadem = await Khadem.findById(req.params.id);
    if(!khadem){
        return res.status(404).json({message: "Khadem not found"});
    }
    const secret = process.env.JWT_SECRET + khadem.password;
    try{
         jwt.verify(req.params.token,secret);
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password,salt);
        khadem.password = req.body.password;
        await khadem.save();
        res.render("success-password");
    }catch(error){
        console.log(error);
        return res.status(401).json({message: "Invalid token"});
    }
});