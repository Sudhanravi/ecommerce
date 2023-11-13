const multer = require("multer");
const { errorHandler } = require("../helpers/dbErrorHandler");
const _ = require("lodash");
const Product = require("../models/product");

exports.productById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .then((product) => {
      if (!product) {
        return res.status(400).json({
          error: "Product not found",
        });
      }
      req.product = product;
      next();
    })
    .catch((err) => {
      return res.status(500).json({
        error: "Internal server error",
      });
    });
};

exports.read = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};

// Configure the multer storage and file filter
const storage = multer.memoryStorage(); // Store the uploaded image in memory

const fileFilter = function (req, file, cb) {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

exports.create = (req, res) => {
  // Use the upload middleware for parsing file uploads
  upload.single("photo")(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({
        error: "Image could not be uploaded",
      });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({
        error: err.message,
      });
    }

    let data = await req.body;

    const { name, description, price, category, quantity, shipping } = data;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    let product = new Product(data);

    if (req.file) {
      if (req.file.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb in size",
        });
      }

      product.photo.data = req.file.buffer;
      product.photo.contentType = req.file.mimetype;
    }

    product
      .save()
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        return res.status(400).json({
          error: errorHandler(err),
        });
      });
  });
};

exports.remove = (req, res) => {
  let product = req.product;
  product
    .deleteOne()
    .then((deletedProduct) => {
      res.json({
        message: "Product Deleted Successfully",
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: errorHandler(err),
      });
    });
};

exports.update = (req, res) => {
  upload.single("photo")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        error: "Image could not be uploaded",
      });
    } else if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

    let data = req.body;

    let product = req.product;
    product = _.extend(product, data);

    if (req.file) {
      if (req.file.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb in size",
        });
      }

      product.photo.data = req.file.buffer;
      product.photo.contentType = req.file.mimetype;
    }

    product
      .save()
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        return res.status(400).json({
          error: errorHandler(err),
        });
      });
  });
};

/*
 *sell/arrival
 *by sell = /products?sortBy=sold&order=desc&limit=4
 *by arrival = /products?sortBy=createdAt&order=desc&limit=4
 *if no params are sent, then all products are returned
 */

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .limit(limit)
    .exec()
    .then((products) => {
      res.json(products);
    })
    .catch((err) => {
      return res.status(400).json({
        error: "Products not found",
      });
    });
};

exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find({ _id: { $ne: req.product }, category: req.product.category })
    .limit(limit)
    .populate("category", "_id name")
    .exec()
    .then((products) => {
      res.json(products);
    })
    .catch((err) => {
      return res.status(400).json({
        error: "Products not found",
      });
    });
};

exports.listCategories = (req, res) => {
  Product.distinct("category", {})
    .then((categories) => {
      res.json(categories);
    })
    .catch((err) => {
      return res.status(400).json({
        error: "Categories not found",
      });
    });
};

exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : "desc";
  let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  // console.log(order, sortBy, limit, skip, req.body.filters);
  // console.log("findArgs", findArgs);

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        // gte -  greater than price [0-10]
        // lte - less than
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  Product.find(findArgs)
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec()
    .then((data) => {
      res.json({
        size: data.length,
        data,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: "Products not found",
      });
    });
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("Content-Type", req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

exports.listSearch = (req, res) => {
  //create query object to hold search value and category value
  const query = {};
  //assign search value to query name
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: "i" };
    //assign category value to query.category
    if (req.query.category && req.query.category != "All") {
      query.category = req.query.category;
    }
    //find the product based on query object with 2 properties
    //search and category
    Product.find(query)
      .select("-photo")
      .then((products) => {
        res.json(products);
      })
      .catch((err) => {
        res.status(400).json({
          error: errorHandler(err),
        });
      });
  }
};

exports.decreaseQuantity = (req, res, next) => {
  let bulkOps = req.body.order.products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item._id },
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    };
  });

  Product.bulkWrite(bulkOps, {})
    .then((products) => {
      if (!products) {
        return res.status(400).json({
          error: "Could not update product",
        });
      }
      next();
    })
    .catch((error) => {
        return res.status(400).json({
        error: "Could not update product",
      });
    });
};
