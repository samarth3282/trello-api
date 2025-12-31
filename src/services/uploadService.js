const multer = require('multer');
const path = require('path');
const { cloudinary } = require('../config/cloudinary');
const { BadRequestError } = require('../utils/errors');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,application/pdf').split(',');

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new BadRequestError(`File type ${file.mimetype} is not allowed`), false);
    }
};

// Multer upload middleware
const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    },
    fileFilter,
});

// Upload to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'task-attachments') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: 'auto',
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
        };
    } catch (error) {
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
};

module.exports = {
    upload,
    uploadToCloudinary,
    deleteFromCloudinary,
};
