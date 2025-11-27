import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { verifyToken } from "./auth.js";
import { upload } from "./uploadService.js";

// Import semua service "movie"
import {
    getMovies,
    getMovie,
    createMovie,
    updateMovie,
    deleteMovie,
    createUser,
    loginUser,
    verifyUser,
} from "./database.js";

const app = express();
app.use(express.json()); // Middleware untuk parsing JSON

/**
 * ENDPOINT: GET /movies
 * Keterangan: List semua movies (TERPROTEKSI + Query Params)
 */
app.get("/movies", verifyToken, async (req, res, next) => {
    try {
        // 1. Ambil semua query params dari URL (req.query)
        const options = {
            search: req.query.search,
            sortBy: req.query.sortBy,
            director: req.query.director,
        };

        // 2. Beri tahu user yang mengakses endpoint ini
        console.log(
            `User ${req.user.username} mengakses /movies dengan filter:`,
            options
        );

        // 3. Panggil service dengan options
        const movies = await getMovies(options);

        res.send(movies);
    } catch (err) {
        // Tangani jika ada error dari database
        next(err);
    }
});

/**
 * ENDPOINT: GET /movie/:id
 * Keterangan: Menampilkan satu movie berdasarkan id
 */
app.get("/movie/:id", async (req, res) => {
    const id = req.params.id;
    const movie = await getMovie(id);

    if (!movie) {
        res.status(404).send({ message: "Movie not found" });
        return;
    }
    res.send(movie);
});

/**
 * ENDPOINT: POST /movie
 * Keterangan: Menambahkan data movie baru
 */
app.post("/movie", async (req, res) => {
    const { title, director, release_year } = req.body;

    if (!title) {
        res.status(400).send({ message: "Title is required" });
        return;
    }

    const movie = await createMovie(title, director, release_year);
    res.status(201).send(movie);
});

/**
 * ENDPOINT: PUT/PATCH /movie/:id
 * Keterangan: Mengubah data berdasarkan id
 * (Kita implementasikan PATCH)
 */
app.patch("/movie/:id", async (req, res) => {
    const id = req.params.id;
    const { title, director, release_year } = req.body;

    if (!title) {
        res.status(400).send({ message: "Title is required" });
        return;
    }

    const movie = await updateMovie(id, title, director, release_year);

    if (!movie) {
        res.status(404).send({ message: "Movie not found" });
        return;
    }
    res.send(movie);
});

/**
 * ENDPOINT: DELETE /movie/:id
 * Keterangan: Menghapus data berdasarkan id
 */
app.delete("/movie/:id", async (req, res) => {
    const id = req.params.id;
    const result = await deleteMovie(id);

    if (!result) {
        res.status(404).send({ message: "Movie not found" });
        return;
    }
    res.send(result);
});

/**
 * ENDPOINT: POST /register
 * Keterangan: Mendaftarkan user baru
 */
app.post("/register", async (req, res, next) => {
    const { fullname, username, email, password } = req.body;

    // Validasi sederhana
    if (!fullname || !username || !email || !password) {
        return res.status(400).send({
            message:
                "Semua field (fullname, username, email, password) wajib diisi.",
        });
    }

    try {
        const user = await createUser(fullname, username, email, password);
        // Kirim 201 Created dan data user (tanpa password)
        res.status(201).send(user);
    } catch (err) {
        // Jika error karena duplikat (dari service kita)
        if (err.message === "Username atau Email sudah terdaftar.") {
            return res.status(409).send({ message: err.message }); // 409 Conflict
        }
        // Kirim ke error handler utama jika ada masalah lain
        next(err);
    }
});

/**
 * ENDPOINT: POST /login
 * Keterangan: Login user dan dapatkan token JWT
 */
app.post("/login", async (req, res, next) => {
    const { email, password } = req.body;

    // Validasi sederhana
    if (!email || !password) {
        return res
            .status(400)
            .send({ message: "Email dan password wajib diisi." });
    }

    try {
        // 1. Autentikasi user (cek email dan password)
        const user = await loginUser(email, password);

        // 2. Jika berhasil, buat Token JWT
        // Data yang ingin kita simpan di dalam token (payload)
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
        };

        // 3. Ambil Secret Key dari .env
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET tidak disetel di .env");
        }

        // 4. Buat token-nya
        // Kita set token ini berlaku selama 1 jam (expiresIn: '1h')
        const token = jwt.sign(payload, secret, { expiresIn: "1h" });

        // 5. Kirim balasan sukses berisi token
        res.status(200).send({
            message: "Login berhasil!",
            token: token,
            user: user, // Kirim juga data user (tanpa password)
        });
    } catch (err) {
        // Tangani error dari service (Email atau password salah)
        if (err.message === "Email atau password salah.") {
            return res.status(401).send({ message: err.message }); // 401 Unauthorized
        }
        // Kirim ke error handler utama
        next(err);
    }
});

/**
 * ENDPOINT: GET /verify-email
 * Keterangan: Menerima token dari link email
 */
app.get("/verify-email", async (req, res, next) => {
    // Ambil token dari query parameter (?token=...)
    const { token } = req.query;

    if (!token) {
        return res.status(400).send({ message: "Token tidak tersedia." });
    }

    try {
        // Panggil service untuk verifikasi
        const result = await verifyUser(token);

        // Kirim respons sukses
        // Di aplikasi nyata, Anda akan redirect ke halaman "Verifikasi Sukses"
        res.status(200).send(result); //
    } catch (err) {
        // Tangani jika token tidak valid
        if (err.message === "Invalid Verification Token") {
            return res.status(400).send({ message: err.message });
        }
        // Error server lainnya
        next(err);
    }
});

/**
 * ENDPOINT: POST /upload
 * Keterangan: Menerima upload file gambar
 * Terproteksi oleh verifyToken
 * Menggunakan middleware upload.single('file')
 */
app.post("/upload", verifyToken, (req, res, next) => {
    // Panggil middleware upload
    // 'file' adalah nama field di form-data
    upload.single("file")(req, res, function (err) {
        // Tangani error dari multer (tipe file, ukuran file, dll)
        if (err instanceof multer.MulterError) {
            // Error dari Multer (misal: file terlalu besar)
            return res
                .status(400)
                .send({ message: `Multer error: ${err.message}` });
        } else if (err) {
            // Error dari fileFilter kita (tipe file tidak valid)
            return res.status(400).send({ message: err.message });
        }

        // 4. Cek jika tidak ada file yang di-upload
        if (req.file == undefined) {
            return res
                .status(400)
                .send({ message: "Tidak ada file yang dipilih." });
        }

        // 5. Jika SEMUA sukses
        // `req.file` berisi semua info file yang di-upload
        console.log("File berhasil di-upload:", req.file);

        // Kirim balasan sukses
        res.status(201).send({
            message: "File berhasil di-upload!",
            filename: req.file.filename,
            path: req.file.path,
        });
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// Jalankan server
const port = 8080;
app.listen(port, () => {
    console.log(`Movie API server is running on port ${port}`);
});
