import multer from "multer";
import path from "path";

// 1. Konfigurasi Penyimpanan (Storage)
const storage = multer.diskStorage({
    // Tentukan folder tujuan
    destination: function (req, file, cb) {
        cb(null, "upload/"); // Sesuai dengan folder yang kita buat
    },

    // Tentukan nama file baru (agar unik)
    filename: function (req, file, cb) {
        // Buat nama unik: timestamp + nama file asli
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// 2. Filter File (Opsional)
// Kita hanya ingin menerima file gambar
function fileFilter(req, file, cb) {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Terima file
    } else {
        // Tolak file dan berikan error
        cb(
            new Error(
                "Tipe file tidak valid. Hanya JPEG, PNG, atau GIF yang diizinkan."
            ),
            false
        );
    }
}

// 3. Inisialisasi dan ekspor middleware multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5, // Batasi ukuran file (misal: 5MB)
    },
});
