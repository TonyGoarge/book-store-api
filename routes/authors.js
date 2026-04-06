const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {Author,validateCreateAuthor,validateUpdateAuthor} = require("../models/Author");
const {verifyTokenAndAdmin} = require("../middleewares/verifyToken");
const authors = [
    {   id: 1, 
        firstName: "John",
        lastName: "Doe"
     },
    {   id: 2, 
        firstName: "tony",
        lastName: "stark"
     },
    {   id: 3, 
        firstName: "Bob",
        lastName: "Doe"
     },
]

/*
 * @desc Get all authors
 * @route /api/authors
 * @method GET
 * @access Public
 */
router.get("/",asyncHandler(
    async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const authorperpage = parseInt(req.query.authorperpage) || 2;
        // const authorlist = await Author.find().sort({firstName:-1}).select("firstName lastName");
        const authorlist = await Author.find().skip((page-1)*authorperpage).limit(authorperpage);

        res.status(200).json(authorlist);
    
}
));

/*
 * @desc Get author by id
 * @route /api/authors/:id
 * @method GET
 * @access Public
 */
router.get("/:id",asyncHandler(
    async(req,res)=>{
    // const author = authors.find(b=>b.id === parseInt(req.params.id));
    const author = await Author.findById(req.params.id);
    if(author){
        res.status(200).json(author);
    }
    else{
        res.status(404).json({message:"Author not found"});
    }
}
));

/*
 * @desc Create new author
 * @route /api/authors
 * @method POST
 * @access Private(only admin)
 */
router.post("/",verifyTokenAndAdmin,asyncHandler(async(req,res)=>{
    const {error} = validateCreateAuthor(req.body);
    if(error){
        return res.status(400).json({message:error.details[0].message});
    }
 
    // authors.push(author); //static date 
 
       const author = new Author({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        nationality: req.body.nationality,
        bio: req.body.bio,
        birthDate: req.body.birthDate,
    })
    const result = await author.save();
    res.status(201).json({message:"Author created successfully",result});
 

}));

/*
 * @desc Update author
 * @route /api/authors/:id
 * @method PUT
 * @access Private(only admin)
 */
router.put("/:id",verifyTokenAndAdmin,asyncHandler(async (req,res)=>{
    const {error} = validateUpdateAuthor(req.body);
    if(error){
        return res.status(400).json({message:error.details[0].message});
    }   
    
    
    const author =  await Author.findByIdAndUpdate(req.params.id,{
        $set:{
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            nationality: req.body.nationality,
            bio: req.body.bio,
            birthDate: req.body.birthDate,
        }
    },{new:true});
    res.status(200).json({message:"Author updated successfully",author});
}



));

/*
 * @desc Delete author
 * @route /api/authors/:id
 * @method DELETE
 * @access Private(only admin)
 */
router.delete("/:id",verifyTokenAndAdmin,asyncHandler(async(req,res)=>{
   
    const author = await Author.findById(req.params.id);
    if(author){
        await Author.findByIdAndDelete(req.params.id);
        res.status(200).json({message:"Author deleted successfully"});
    }
    else{
        res.status(404).json({message:"Author not found"});
    }

}
));


module.exports = router;
