const app = require('./app');
const connectDB = require('./config/db');
const cloudinary = require('cloudinary')

// database connection
connectDB()

// cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

app.listen(process.env.PORT , () => {
    console.log(`Server is running on port ${process.env.PORT }`);
})
