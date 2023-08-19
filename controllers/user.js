const { Order } = require("../models/order");
const User = require("../models/user");

exports.userById = (req, res, next, id) => {
  User.findById(id)
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(400).json({
          error: "User not found",
        });
      }
      req.profile = user;
      next();
    })
    .catch((err) => {
      return res.status(500).json({
        error: "Internal server error",
      });
    });
};

// exports.userById = (req, res, next, id) => {
//     User.findById(id).exec((err, user) => {
//       if (err || !user) {
//         return res.status(400).json({               we can't use exeu coz " Query.prototype.exec() no longer accepts a callback "
//           error: "User not found",
//         });                                         so we're writing alternate code
//       }
//       req.profile = user;
//       next();
//     });
//   };

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

exports.update = (req, res) => {
  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $set: req.body },
    { new: true }
  )
    .then((user) => {
      user.hashed_password = undefined;
      user.salt = undefined;
      res.json(user);
    })
    .catch((err) => {
      return res.status(400).json({
        error: "You are not authorized to perform this action",
      });
    });
};

exports.addOrderToUserHistory = (req, res, next) => {
  let history = [];

  req.body.order.products.forEach((item) => {
    history.push({
      _id: item._id,
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.count,
      transaction_id: req.body.order.transaction_id,
      amount: req.body.order.amount,
    });
  });

  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $push: { history: history } },
    { new: true }
  )
    .then((data) => {
      if (!data) {
        return res.status(400).json({
          error: "Could not update user purchase history",
        });
      }
      next();
    })
    .catch((error) => {
      return res.status(400).json({
        error: "Could not update user purchase history",
      });
    });
};

exports.purchaseHistory = (req, res) => {
  Order.find({ user: req.profile._id })
    .populate("user", "_id name")
    .sort('-created')
    .exec()
    .then((orders) => {
      res.json(orders);
    })
    .catch((err) => {
      return res.status(400).json({
        error: errorHandler(err),
      });
    });
};
