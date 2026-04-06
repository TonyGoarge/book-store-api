const {Book} = require("./models/Book");
const {Author} = require("./models/Author");
const {books,authors} = require("./data");
const connectToDB = require("./config/db");
require("dotenv").config();


// Connect To DB
connectToDB();

// Import Books
const importBooks = async () => {
    try {
        await Book.insertMany(books);
        console.log("Books imported successfully");
    }catch(error){
        console.log("Error importing books",error);
        process.exit(1);
    }
}

// Import Authors
const importAuthors = async () => {
    try {
        await Author.insertMany(authors);
        console.log("Authors imported successfully");
    }catch(error){
        console.log("Error importing authors",error);
        process.exit(1);
    }
}

// Delete Authors
const deleteAuthors = async () => {
    try {
        await Author.deleteMany();
        console.log("Authors deleted successfully");
    }catch(error){
        console.log("Error deleting authors",error);
        process.exit(1);
    }
}

// Delete Books
const deleteBooks = async () => {
    try {
        await Book.deleteMany();
        console.log("Books deleted successfully");
    }catch(error){
        console.log("Error deleting books",error);
        process.exit(1);
    }
}

if(process.argv[2] === "-import"){
    importBooks();
}else if(process.argv[2] === "-delete"){
    deleteBooks();
}else if(process.argv[2] === "-import-authors"){
    importAuthors();
}else if(process.argv[2] === "-delete-authors"){
    deleteAuthors();
}
