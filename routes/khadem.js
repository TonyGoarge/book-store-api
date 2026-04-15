const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {Khadem,validateCreateKhadem,validateUpdateKhadem} = require("../models/Khadem");
const {verifyTokenAndAdmin} = require("../middleewares/verifyToken");


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
        const khademlist = await Khadem.find().skip((page-1)*khademperpage).limit(khademperpage);

        res.status(200).json(khademlist);
    
}
));

/*
 * @desc Get khadem by id
 * @route /api/khadem/:id
 * @method GET
 * @access Public
 */
router.get("/:id",asyncHandler(
    async(req,res)=>{
    // const author = authors.find(b=>b.id === parseInt(req.params.id));
    const khadem = await Khadem.findById(req.params.id);
    if(khadem){
        res.status(200).json(khadem);
    }
    else{
        res.status(404).json({message:"Author not found"});
    }
}
));



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
