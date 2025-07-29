const multer = require('multer');
const path = require('path');

// Store in /public/uploads/profile/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/profile');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `user-${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    cb(null, ext && mime);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
