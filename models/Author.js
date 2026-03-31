const mongoose = require("mongoose");

const Joi = require("joi");

const authorSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 200,
    },
    lastName:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 200,
    },
    nationality:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 200,
    },
    image:{
        type: String,
        default: "/uploads/authors/default.jpg",
    },
    bio:{
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 15,
    },
    birthDate:{
        type: Date,
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
    updatedAt:{
        type: Date,
        default: Date.now,
    },
},
{
    timestamps: true,
});

const Author = mongoose.model("Author",authorSchema);

// Validate Create Author
function validateCreateAuthor(obj){
    const schema = Joi.object({
        firstName: Joi.string().trim().min(3).max(15).required(),
        lastName: Joi.string().trim().min(3).max(15).required(),
        nationality: Joi.string().trim().min(3).max(15).required(),
        bio: Joi.string().trim().min(3).max(15),
        birthDate: Joi.date(),
    });
    return schema.validate(obj);
}
// Validate Update Author
function validateUpdateAuthor(obj){
    const schema = Joi.object({
        firstName: Joi.string().trim().min(3).max(15),
        lastName: Joi.string().trim().min(3).max(15),
        nationality: Joi.string().trim().min(3).max(15),
        bio: Joi.string().trim().min(3).max(15),
        birthDate: Joi.date(),
    });
    return schema.validate(obj);
}
module.exports = {
    Author,
    validateCreateAuthor,
    validateUpdateAuthor
};