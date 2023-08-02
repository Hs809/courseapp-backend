const express = require("express");
require("dotenv").config();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const app = express();
const rateLimit = require("express-rate-limit");
const cors = require("cors");

// temp check
app.set("view engine", "ejs");

// for swagger documentation
const YAML = require("yamljs");

// rate limiter middlerware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// regular middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

// for cookies and file middlewares
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// morgan middleware
app.use(morgan("tiny"));

// import all router here
const user = require("./routes/user");
const course = require("./routes/course");
const order = require("./routes/order");
const { application } = require("express");
const payment = require("./routes/payment");

app.use("/api/v1", user);
app.use("/api/v1", course);
app.use("/api/v1", payment);
app.use("/api/v1", order);

// export the app js
module.exports = app;
