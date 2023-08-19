const Category = require("../models/category");
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.categoryById = async (req, res, next, id) => {
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }
    req.category = category;
    next();
  } catch (err) {
    console.error("Error finding product by ID:", err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

exports.create = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    return res.json({ category });
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.read = (req, res) => {
  return res.json(req.category);
};

exports.update = async (req, res) => {
  const category = req.category;
  category.name = req.body.name;
  try {
    await category.save();
    return res.json({ category });
  } catch (err) {
    return res.status(400).json({ error: "Error updating category" });
  }
};

exports.remove = async (req, res) => {
  const category = req.category;
  try {
    await category.deleteOne();
    return res.json({ message: "Category Deleted Successfully" });
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.list = async (req, res) => {
  try {
    const category = await Category.find();
    return res.json({ category });
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};
