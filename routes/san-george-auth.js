const express = require("express");
const router = express.Router();
const {createKhadem,loginKhadem} = require("../controllers/khadem-authController");


router.post("/register", createKhadem);


router.post("/login", loginKhadem);
module.exports = router;