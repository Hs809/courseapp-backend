const User = require("../model/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customerError");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const Course = require("../model/course");
const WhereClause = require("../utils/whereClause");

// users controllers
exports.addCourse = BigPromise(async (req, res, next) => {
  if (!req.files.thumbnail || !req.files.video) {
    return next(new CustomError("Video and Image are required", 401));
  }
  if (req.files) {
    if (req.files.thumbnail) {
      let result = await cloudinary.uploader.upload(
        req.files.thumbnail.tempFilePath,
        {
          folder: "courses/image",
        }
      );
      console.log({ result });
      req.body.thumbnail = {
        id: result.public_id,
        secure_url: result.secure_url,
      };
    }
    if (req.files.video) {
      let result = await cloudinary.uploader.upload(
        req.files.video.tempFilePath,
        {
          folder: "courses/videos",
          resource_type: "video",
        }
      );
      console.log({ result });
      req.body.video = {
        id: result.public_id,
        secure_url: result.secure_url,
      };
    }
  }

  req.body.user = req.user.id;
  const course = await Course.create(req.body);
  console.log({ course });
  res.status(200).json({
    success: true,
    data: course,
  });
});

exports.getAllCourses = BigPromise(async (req, res, next) => {
  const resultperPage = 10;
  const totalProductCount = await Course.countDocuments();

  const courseObj = new WhereClause(
    Course.find().select("-video").populate("user"),
    req.query
  )
    .search()
    .filter();

  let course = await courseObj.base;
  const filterProductNumber = course.length;

  // course.limit.skip()

  courseObj.pager(resultperPage);
  course = await courseObj.base.clone();

  res.status(200).json({
    success: true,
    course,
    length: filterProductNumber,
    totalProductCount,
  });
});

exports.getOneCourse = BigPromise(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new CustomError("No Product Found with this id", 401));
  }
  res.status(200).json({
    success: true,
    course,
  });
});
exports.addReview = BigPromise(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };
  const product = await Course.findById(productId);
  const alreadyReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id
  );
  if (alreadyReviewed) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id) {
        review.comment = comment;
        review.rating = Number(rating);
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }
  // adjust rating
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  // save
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});
exports.deleteReview = BigPromise(async (req, res, next) => {
  const { productId } = req.query;

  const product = await Course.findById(productId);
  const reviews = product.reviews.filter(
    (rev) => (rev) => rev.user.toString() === req.user._id
  );

  const numberOfReviews = reviews.length;

  // adjust rating
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  // update the product
  await Course.findByIdAndUpdate(
    productId,
    {
      reviews,
      ratings,
      numberOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});

exports.getOnlyReviewsForOneProduct = BigPromise(async (req, res, next) => {
  const product = await Course.findById(req.query.id);

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// admin controllers
exports.adminGetAllProduct = BigPromise(async (req, res, next) => {
  const products = await Course.find({});
  res.status(200).json({
    success: true,
    products,
  });
});
exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
  let course = await Course.findById(req.params.id);
  if (!course) {
    return next(new CustomError("No Product Found with this id", 401));
  }
  let imagesArray = [];
  if (req.files) {
    //destroy the existing images then upload and save the images
    for (let index = 0; index < course.photos.length; index++) {
      const element = course.photos[index];
      const result = await cloudinary.uploader.destroy(element.id);
    }
    for (let index = 0; index < req.files.photos?.length; index++) {
      let result = await cloudinary.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: "courses", //folder name -> .env
        }
      );

      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }
  req.body.photos = imagesArray;
  course = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: true,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new CustomError("No Product Found with this id", 401));
  }
  for (let index = 0; index < course.photo.length; index++) {
    const element = course.photo;
    await cloudinary.uploader.destroy(element.id);
  }

  await course.remove();

  res.status(200).json({
    success: true,
    message: "Product was deleted !",
  });
});
