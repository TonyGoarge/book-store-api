const express = require("express");
const router = express.Router();
const Joi = require("joi");
const {validateCreateBook,validateUpdateBook,Book} = require("../models/Book");
const asyncHandler = require("express-async-handler");
const {verifyTokenAndAdmin} = require("../middleewares/verifyToken");
const books = [
    {
        id: 1,
        title: "Book 1",
        author: "Author 1",
        description: "Description 1",
        price: 10,
        genre: "Genre 1",
    },
    {
        id: 2,
        title: "Book 2",
        author: "Author 2",
        description: "Description 2",
        price: 20,
        genre: "Genre 2",
    },
    {
        id: 3,
        title: "Book 3",
        author: "Author 3",
        description: "Description 3",
        price: 30,
        genre: "Genre 3",
    },
];

/*
 * @desc Get all books
 * @route  /api/books
 * @method GET
 * @access Public
 */
router.get("/", asyncHandler(async(req, res) => {
    const books = await Book.find().populate("author",["_id","firstName","lastName"]);
    res.json(books);
}));

/*
 * @desc Get book by id
 * @route  /api/books/:id
 * @method GET
 * @access Public
 */
router.get("/:id", asyncHandler(async(req, res) => {
    const book = await Book.findById(req.params.id).populate("author");
    if (book) {
        res.status(200).json(book);
    } else {
        res.status(404).json({ message: "Book not found" })
    }
}));

/*
 * @desc Create new book
 * @route  /api/books
 * @method POST
 * @access Private (only admin)
 */
router.post("/",verifyTokenAndAdmin, asyncHandler(async(req, res) => {

    const { error } = validateCreateBook(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    console.log(req.body);
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        price: req.body.price,
        cover: req.body.cover,
    });
    const result = await book.save();
    res.status(201).json({message:"Book created successfully",result});
}));

/*
 * @desc Update book
 * @route  /api/books/:id
 * @method PUT
 * @access Private (only admin)
 */
router.put("/:id",verifyTokenAndAdmin, asyncHandler(async(req, res) => {
    const { error } = validateUpdateBook(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, {
    
    $set: {
    title: req.body.title,
    author: req.body.author,
    description: req.body.description,
    price: req.body.price,
    cover: req.body.cover,
}
    }, { new: true });
    if (updatedBook) {
        res.status(200).json({ message: "Book updated successfully",updatedBook });
    }
    else{
         res.status(404).json({ message: "Book not found" });
    }
}));

/*
 * @desc Delete book
 * @route  /api/books/:id
 * @method DELETE
 * @access Private (only admin)
 */
router.delete("/:id",verifyTokenAndAdmin, asyncHandler(async(req, res) => {
    const book = await Book.findById(req.params.id);
    if (book) {
        await Book.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Book deleted successfully" });
    }
    else{
        res.status(404).json({ message: "Book not found" });
    }
}));

// Validate Create book


module.exports = router;