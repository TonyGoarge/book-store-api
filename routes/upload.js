const express = require('express')

const router = express.Router()
const multer = require('multer');
const path = require("path");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../images"))
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage })
router.post("/", upload.single('image'), (re, res) => {
    res.status(200).json({ message: "image Uploaded Successfully " })
},)

module.exports = router