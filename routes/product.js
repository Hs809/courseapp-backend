const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/user");
const {
  addProduct,
  getAllCourses,
  adminGetAllProduct,
  getOneProduct,
  adminUpdateOneProduct,
  adminDeleteOneProduct,
  addReview,
  deleteReview,
  getOnlyReviewsForOneProduct,
} = require("../controllers/courseController");

// user routes
router.route("/products").get(isLoggedIn, getAllCourses);
router.route("/admin/product/:id").get(getOneProduct);
router.route("/review").put(isLoggedIn, addReview);
router.route("/review").delete(isLoggedIn, deleteReview);
router.route("/reviews").get(isLoggedIn, getOnlyReviewsForOneProduct);

// amin routes
router
  .route("/admin/product/add")
  .post(isLoggedIn, customRole("admin"), addProduct);
router
  .route("/admin/products")
  .get(isLoggedIn, customRole("admin"), adminGetAllProduct);
router
  .route("/admin/product/:id")
  .put(isLoggedIn, customRole("admin"), adminUpdateOneProduct);
router
  .route("/admin/product/:id")
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);

module.exports = router;
