const mongoose = require("mongoose");

const Joi = require("joi");

const bookSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 200,
    },
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Author",
        required: true,
    },
    description:{
        type: String,
        required: true,
        trim: true,
        minlength: 5,
    },
    price:{
        type: String,
        required: true,
        min: 0,
    },
    cover:{
        type: String,
        required: true,
        enum: ["Hard Cover", "Soft Cover"] 
    },
},
{
    timestamps: true,
});

const Book = mongoose.model("Book",bookSchema);

// Validate Create Book
function validateCreateBook(obj) {
        const schema = Joi.object({
        title: Joi.string().trim().min(3).max(200).required(),
        author: Joi.string().required(),
        description: Joi.string().trim().min(5).required(),
        price: Joi.number().min(0).required(),
        cover: Joi.string().valid("Hard Cover", "Soft Cover").required(),
    });

    return schema.validate(obj);
}

function validateUpdateBook(obj) {
        const schema = Joi.object({
        title: Joi.string().trim().min(3).max(200),
        author: Joi.string().trim().min(3).max(200),
        description: Joi.string().trim().min(5),
        price: Joi.number().min(0),
        cover: Joi.string().valid("Hard Cover", "Soft Cover"),
    });

    return schema.validate(obj);
}
module.exports = {
    Book,
    validateCreateBook,
    validateUpdateBook
};