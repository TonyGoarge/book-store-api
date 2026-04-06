const express = require("express");
const router = express.Router();
const Joi = require("joi");
const {verifyTokenAndAdmin} = require("../middleewares/verifyToken");
const {getAllBooks,getBooksbyId,createBook,updateBook,deleteBook} = require("../controllers/bookController");
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


// router.get("/", getAllBooks);
// router.get("/:id", getBooksbyId);

//api/books
router.route("/")
.get(getAllBooks)
.post(verifyTokenAndAdmin,createBook);

// api/books/:id
router.route("/:id")
.get(getBooksbyId)
.put(verifyTokenAndAdmin,updateBook)
.delete(verifyTokenAndAdmin,deleteBook);


// router.post("/",verifyTokenAndAdmin,createBook );


// router.put("/:id",verifyTokenAndAdmin,updateBook );


// router.delete("/:id",verifyTokenAndAdmin,deleteBook );



module.exports = router;