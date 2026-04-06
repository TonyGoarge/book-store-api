const asyncHandler = require("express-async-handler");
const {validateCreateBook,validateUpdateBook,Book} = require("../models/Book");

/*
 * @desc Get all books
 * @route  /api/books
 * @method GET
 * @access Public
 */
const getAllBooks = asyncHandler(async(req, res) => {
    const {maxprice,minprice} = req.query;
    const books = await Book.find({price:{$gte:minprice,$lte:maxprice}}).populate("author",["_id","firstName","lastName"]);
    res.json(books);
})

/*
 * @desc Get book by id
 * @route  /api/books/:id
 * @method GET
 * @access Public
 */
const getBooksbyId = asyncHandler(async(req, res) => {
    const book = await Book.findById(req.params.id).populate("author");
    if (book) {
        res.status(200).json(book);
    } else {
        res.status(404).json({ message: "Book not found" })
    }
})

/*
 * @desc Create new book
 * @route  /api/books
 * @method POST
 * @access Private (only admin)
 */
const createBook = asyncHandler(async(req, res) => {

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
})

    
/*
 * @desc Update book
 * @route  /api/books/:id
 * @method PUT
 * @access Private (only admin)
 */ 
const updateBook = asyncHandler(async(req, res) => {
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
})
    
/*
 * @desc Delete book
 * @route  /api/books/:id
 * @method DELETE
 * @access Private (only admin)
 */
const deleteBook = asyncHandler(async(req, res) => {
    const book = await Book.findById(req.params.id);
    if (book) {
        await Book.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Book deleted successfully" });
    }
    else{
        res.status(404).json({ message: "Book not found" });
    }
})
    
module.exports = {
    getAllBooks,
    getBooksbyId,
    createBook,
    updateBook,
    deleteBook
}