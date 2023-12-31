const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const expressValidator = require("express-validator");
require("dotenv").config();

//import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const braintreeRoutes = require("./routes/braintree");
const orderRoutes = require("./routes/order");

//app
const app = express();

//db connection

//in .env file if u mention (DATABASE=MONGO_URI=mongodb+srv://u1:p1@cluster0.vk71gbs.mongodb.net/?retryWrites=true&w=majority) below '//' things u need to do it will connect with cloud mongo

// mongoose.connect(
//     process.env.MONGO_URI,
//     {useNewUrlParser: true}
//   )
//   .then(() => console.log('DB Connected'))

//   mongoose.connection.on('error', err => {
//     console.log(`DB connection error: ${err.message}`)
//   });

mongoose
  .connect(process.env.DATABASE, {
    // useNewUrlParser: true,
    // useCreateIndex: true
  })
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB Error => ", err));

//middlewares
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());

//routes middleware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", braintreeRoutes);
app.use("/api", orderRoutes);

//http://localhost:8000/api

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
