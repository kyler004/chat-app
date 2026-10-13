import multer from 'multer';

// Max file size 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
        // Support images and basic files only
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and basic files are allowed.'));
        }
    }
});
