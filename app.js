const express = require("express");
const logger = require("./middleewares/logger");
const { notFound, errorHandler } = require("./middleewares/error");
require("dotenv").config();
const connectToDB = require("./config/db");


//Connect to MongoDB
connectToDB();


// iniit app
const app = express();

// Apply middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger);
app.set("view engine", "ejs");

//Routes
app.use("/api/books", require("./routes/books"));
app.use("/api/authors", require("./routes/authors"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/user"));
app.use("/api/khadem", require("./routes/san-george-auth"));
app.use("/api/khadem", require("./routes/khadem"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/statistics", require("./routes/statistics"));
app.use("api/password", require("./routes/password"));
// Error Handler Middleware
app.use(notFound);
app.use(errorHandler);

app.put("/", (req, res) => {
    res.send("Hello World!");
});

app.delete("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
});