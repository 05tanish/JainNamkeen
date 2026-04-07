import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_CLOUD_NAME) {
    console.log("Configuring with CLOUDINARY_CLOUD_NAME: '" + process.env.CLOUDINARY_CLOUD_NAME + "'");
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

cloudinary.api.resources({ max_results: 1 })
    .then(result => console.log('Success!', result))
    .catch(error => console.error('Error:', error));
