const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100,
        unique: true,
    },
    password:{
        type: String,
        required: true,
        trim: true,
        minlength: 6,
    },
    username:{
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200,
    },
    isAdmin:{
        type: Boolean,
        default: false,
    },

    
},{timestamps: true});

// Generate Token
userSchema.methods.generateToken = function(){
    return jwt.sign({id: this._id , isAdmin: this.isAdmin},process.env.JWT_SECRET) ;  
}
const User = mongoose.model("User",userSchema);



// Validate Register User
function validateRegisterUser(obj) {
    const schema = Joi.object({
        email: Joi.string().trim().min(5).max(100).required().email(),
        password: Joi.string().trim().min(6).required(),
        username: Joi.string().trim().min(2).max(200).required(),
    });
    return schema.validate(obj);
}

// Validate Login User
function validateLoginUser(obj) {
    const schema = Joi.object({
        email: Joi.string().trim().min(5).max(100).required().email(),
        password: Joi.string().trim().min(6).required(),
    });
    return schema.validate(obj);
}

// Validate Update User
function validateUpdateUser(obj) {
    const schema = Joi.object({
        email: Joi.string().trim().min(5).max(100),
        password: Joi.string().trim().min(6),
        username: Joi.string().trim().min(2).max(200),
    });
    return schema.validate(obj);
}

module.exports = {
    User,
    validateRegisterUser,
    validateLoginUser,
    validateUpdateUser
};