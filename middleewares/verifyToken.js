const jwt = require("jsonwebtoken");
//verify token
function verifyToken(req, res, next) {
    try {
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

//verify token and Authorization
function verifyTokenAndAuthorization(req, res, next) {
    verifyToken(req, res, () => {
            if(req.params.id === req.user.id || req.user.isAdmin){ //req.params.id => url, req.user.id => token -لو انت صاحب الاكونت او admin
        return next();
    }
    return res.status(403).json({ message: "You are not allowed" });
    });
}

//verify token and admin
function verifyTokenAndAdmin(req, res, next) {
    verifyToken(req, res, () => {
            if(req.user.isAdmin){ 
        return next();
    }
    return res.status(403).json({ message: "You are not allowed, only admin allowed" });
    });
}
module.exports = {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin};