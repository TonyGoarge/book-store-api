const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const khademSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 200,
    },
    imageUrl:{
        type: String,
        default: "/uploads/authors/default.jpg",
    },
    phone:{
        type: String,
        required: true,
        trim: true,
        minlength: 11,
        maxlength: 20,
    },
    password:{
        type: String,
        required: true,
        trim: true,
        minlength: 6,
    },
    email:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 200,
    },
    church:{
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 200,
    },
    address:{
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 15,
    },
    birthDate:{
        type: Date,
    },
    isAdmin:{
        type: Boolean,
        default: false,
    },
    fcmToken: {
        type: String,
        default: null,
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
// Generate Token
khademSchema.methods.generateToken = function(){
    return jwt.sign({id: this._id , isAdmin: this.isAdmin},process.env.JWT_SECRET) ;  
}
const Khadem = mongoose.model("Khadem",khademSchema);

// Validate Register Khadem
function validateRegisterKhadem(obj){
    const schema = Joi.object({
        name: Joi.string().trim().min(3).max(200).required(),
        imageUrl: Joi.string().trim().min(3).max(200),
        address: Joi.string().trim().min(3).max(200),
        phone: Joi.string().trim().min(11).max(20).required(),
        email: Joi.string().trim().min(3).max(200).required(),
        church: Joi.string().trim().min(3).max(200).required(),
        password: Joi.string().trim().min(6).required(),
        fcmToken: Joi.string().trim().min(3).max(200),
        birthDate: Joi.date(),
    });
    return schema.validate(obj);
}

// Validate Login Khadem
function validateLoginKhadem(obj){
    const schema = Joi.object({
        email: Joi.string().trim().min(3).max(200).required(),
        password: Joi.string().trim().min(6).required(),
    });
    return schema.validate(obj);
}

// Validate Update Khadem
function validateUpdateKhadem(obj){
    const schema = Joi.object({
        name: Joi.string().trim().min(3).max(15),
        imageUrl: Joi.string().trim().min(3).max(15),
        address: Joi.string().trim().min(3).max(15),
        phone: Joi.string().trim().min(3).max(15),
        email: Joi.string().trim().min(3).max(15),
        church: Joi.string().trim().min(3).max(15),
        password: Joi.string().trim().min(6),
        birthDate: Joi.date(),
    });
    return schema.validate(obj);
}
module.exports = {
    Khadem,
    validateRegisterKhadem,
    validateLoginKhadem,
    validateUpdateKhadem
};