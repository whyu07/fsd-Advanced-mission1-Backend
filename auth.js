import jwt from "jsonwebtoken";

/**
 * MIDDLEWARE: Memverifikasi Token JWT
 */
export function verifyToken(req, res, next) {
    // 1. Ambil token dari header 'Authorization'
    const authHeader = req.headers.authorization;

    // Format headernya adalah: "Bearer <token>"
    // Kita perlu memisahkannya untuk mengambil token-nya saja
    const token = authHeader && authHeader.split(" ")[1];

    // 2. Cek jika token tidak ada
    if (token == null) {
        // 401 Unauthorized
        return res
            .status(401)
            .send({ message: "Akses ditolak. Token tidak tersedia." });
    }

    // 3. Ambil Secret Key dari .env
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res
            .status(500)
            .send({
                message: "Internal Server Error: JWT_SECRET tidak disetel.",
            });
    }

    // 4. Verifikasi token-nya
    try {
        const userPayload = jwt.verify(token, secret);

        // Jika berhasil, kita "sisipkan" data user ke dalam object `req`
        // Ini akan berguna nanti jika kita ingin tahu SIAPA yang mengakses endpoint
        req.user = userPayload;

        // 5. Lanjutkan ke endpoint/middleware selanjutnya
        next();
    } catch (err) {
        // Jika token tidak valid atau kedaluwarsa
        // 403 Forbidden (token ada tapi tidak valid)
        return res.status(403).send({ message: "Token tidak valid." });
    }
}
