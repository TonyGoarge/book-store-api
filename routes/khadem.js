const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {Khadem,validateCreateKhadem,validateUpdateKhadem} = require("../models/Khadem");
const {verifyTokenAndAdmin, verifyToken} = require("../middleewares/verifyToken");
const admin = require("firebase-admin");




/*
 * @desc Get all khadems
 * @route /api/khadem
 * @method GET
 * @access Public
 */
router.get("/",asyncHandler(
    async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const khademperpage = parseInt(req.query.khademperpage) || 2;
        // const authorlist = await Author.find().sort({firstName:-1}).select("firstName lastName");
        const khademlist = await Khadem.find().select("-password").skip((page-1)*khademperpage).limit(khademperpage);

        res.status(200).json(khademlist);
    
}
));

/*
 * @desc Get all khadems names for dropdown menu
 * @route /api/khadem/all
 * @method GET
 * @access Public
 */
router.get("/all", asyncHandler(async (req, res) => {
  const khadems = await Khadem.find()
    .select("name _id")
    .sort({ name: 1 });

  res.status(200).json(khadems);
}));

/*
 * @desc Get khadems birthdays today and notify
 * @route /api/khadem/birthdays-today-and-notify
 * @method GET
 * @access Private(only admin)
 */
router.get("/birthdays-today-and-notify", asyncHandler(async (req, res) => {
  if (req.headers['authorization'] !== `Bearer ${process.env.CORN_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // ← Firebase init جوا الـ function مش برا
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.project_id,
        clientEmail: process.env.CLIENT_EMAIL,
        privateKey: process.env.private_key
          ?.replace(/\\n/g, '\n')
          ?.replace(/"/g, ''),
      }),
    });
  }

  const today = new Date();
  const khadems = await Khadem.find({
    fcmToken: { $ne: null },
    // $expr: {
    //   $and: [
    //     { $eq: [{ $month: "$birthDate" }, today.getMonth() + 1] },
    //     { $eq: [{ $dayOfMonth: "$birthDate" }, today.getDate()] },
    //   ],
    // },
  }).select("name fcmToken");

  const results = [];
  for (const khadem of khadems) {
    try {
      await admin.messaging().send({
        token: khadem.fcmToken,
        notification: {
          title: "🎂 عيد ميلاد سعيد!",
          body: `كل سنة وانت طيب يا ${khadem.name}`,
        },
      });
      results.push({ name: khadem.name, status: "sent" });
    } catch (err) {
      results.push({ name: khadem.name, status: "failed", error: err.message });
    }
  }

  res.status(200).json({ total: results.length, results });
}));
/*
 * @desc Get khadem by id
 * @route /api/khadem/:id
 * @method GET
 * @access Public
 */
router.get("/:id",asyncHandler(
    async(req,res)=>{
    // const author = authors.find(b=>b.id === parseInt(req.params.id));
    const khadem = await Khadem.findById(req.params.id).select("-password");
    if(khadem){
        res.status(200).json(khadem);
    }
    else{
        res.status(404).json({message:"Author not found"});
    }
}
));
 
// PUT /api/khadem/:id/fcm-token
router.put("/:id/fcm-token", verifyToken, asyncHandler(async (req, res) => {
  await Khadem.findByIdAndUpdate(req.params.id, { fcmToken: req.body.fcmToken });
  res.status(200).json({ message: "Token updated" });
}));


/*
 * @desc Update khadem
 * @route /api/khadem/:id
 * @method PUT
 * @access Private(only admin)
 */
router.put("/:id",verifyTokenAndAdmin,asyncHandler(async (req,res)=>{
    const {error} = validateUpdateKhadem(req.body);
    if(error){
        return res.status(400).json({message:error.details[0].message});
    }   
    
    
    const khadem =  await Khadem.findByIdAndUpdate(req.params.id,{
        $set:{
            name: req.body.name,
            imageUrl: req.body.imageUrl,
            address: req.body.address,
            phone: req.body.phone,
            email: req.body.email,
            church: req.body.church,
            birthDate: req.body.birthDate,
        }
    },{new:true});
    res.status(200).json({message:"Author updated successfully",khadem});
}



));

/*
 * @desc Delete author
 * @route /api/authors/:id
 * @method DELETE
 * @access Private(only admin)
 */
router.delete("/:id",verifyTokenAndAdmin,asyncHandler(async(req,res)=>{
   
    const khadem = await Khadem.findById(req.params.id);
    if(khadem){
        await Khadem.findByIdAndDelete(req.params.id);
        res.status(200).json({message:"Khadem deleted successfully"});
    }
    else{
        res.status(404).json({message:"Khadem not found"});
    }

}
));


module.exports = router;
