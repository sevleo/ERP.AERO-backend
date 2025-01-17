const asyncHandler = require("express-async-handler");

const home = asyncHandler(async (req, res) => {
  console.log(req.headers);
  res.render("index", { user: "" });
});

const signup = asyncHandler(async (req, res) => {
  res.render("signup");
});

const navigation = {
  home,
  signup,
};

module.exports = navigation;
