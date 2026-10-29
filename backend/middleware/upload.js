const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique timestamp-based filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter restricting to .jpg, .jpeg, .png, and .pdf
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /^\.(jpg|jpeg|png|pdf)$/i;
  const allowedMimeTypes = /^(image\/jpeg|image\/png|application\/pdf)$/i;

  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only .jpg, .jpeg, .png, and .pdf files are allowed.')
    );
  }
};

// 5MB file size limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

module.exports = upload;
