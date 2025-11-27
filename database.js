import nodemailer from "nodemailer";
// Untuk membuat akun Ethereal
// nodemailer.createTestAccount((err, account) => {
//   if (err) {
//     console.error('Failed to create a test account', err);
//     return;
//   }
//   console.log('Ethereal credentials:', account);
// });

import mysql from "mysql2";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "./emailService.js";
dotenv.config();

// Membuat connection pool
const pool = mysql
    .createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })
    .promise();

/**
 * SERVICE: Membuat user baru (Register)
 * (Sekarang dengan token verifikasi & kirim email)
 */
export async function createUser(fullname, username, email, plainPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // 3. Generate token UUID unik
    const verificationToken = uuidv4();

    try {
        // 4. Simpan user BESERTA tokennya
        const [result] = await pool.query(
            `
      INSERT INTO users (fullname, username, email, password, verification_token) 
      VALUES (?, ?, ?, ?, ?)
    `,
            [fullname, username, email, hashedPassword, verificationToken]
        );

        const id = result.insertId;

        // 5. Kirim email verifikasi (tanpa mengganggu alur utama)
        // Kita panggil tapi tidak pakai 'await' agar berjalan di background
        sendVerificationEmail(email, verificationToken).catch((err) => {
            console.error("Gagal mengirim email di background:", err);
        });

        // 6. Kembalikan data user (tanpa password)
        const [rows] = await pool.query(
            "SELECT id, fullname, username, email, created_at, is_verified FROM users WHERE id = ?",
            [id]
        );
        return rows[0];
    } catch (err) {
        // (blok catch error duplikat)
        if (err.code === "ER_DUP_ENTRY") {
            throw new Error("Username atau Email sudah terdaftar.");
        }
        throw err;
    }
}

/**
 * SERVICE: Mengecek kredensial user (Login)
 */
export async function loginUser(email, plainPassword) {
    // 1. Cari user berdasarkan email
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
        email,
    ]);
    const user = rows[0];

    if (!user) {
        // Jangan beri tahu apakah email-nya yang salah
        // atau password-nya yang salah. Cukup beri satu pesan error.
        throw new Error("Email atau password salah.");
    }

    // 2. Bandingkan password yang di-input dengan hash di database
    const isMatch = await bcrypt.compare(plainPassword, user.password);

    if (!isMatch) {
        // Pesan error yang sama
        throw new Error("Email atau password salah.");
    }

    // 3. Jika berhasil, kembalikan data user (tanpa password)
    // Hapus properti password dari objek user sebelum mengembalikannya
    delete user.password;
    return user;
}

/**
 * SERVICE: Memverifikasi user berdasarkan token
 */
export async function verifyUser(token) {
    // 1. Cari user dengan token yang cocok
    const [rows] = await pool.query(
        "SELECT * FROM users WHERE verification_token = ?",
        [token]
    );
    const user = rows[0];

    if (!user) {
        // 2. Jika token tidak ada atau tidak valid
        throw new Error("Invalid Verification Token");
    }

    // 3. Jika token ditemukan, update user-nya
    // Kita set is_verified = true DAN hapus tokennya (best practice, agar tidak bisa dipakai lagi)
    await pool.query(
        "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?",
        [user.id]
    );

    return { message: "Email Verified Successfully" };
}

/**
 * SERVICE: Mengambil SEMUA movies (dengan filter, sort, search)
 */
export async function getMovies(options = {}) {
    // Ambil options, berikan nilai default jika tidak ada
    const { search, sortBy, director } = options;

    // 1. Mulai dengan kueri dasar
    let query = "SELECT * FROM movies";
    let queryParams = []; // Array untuk parameter, anti-SQL Injection

    // 2. Buat klausa WHERE (untuk search dan filter)
    let whereClauses = [];

    // Implementasi SEARCH (mencari di 'title')
    if (search) {
        whereClauses.push("title LIKE ?");
        queryParams.push(`%${search}%`); // %..% berarti "mengandung"
    }

    // Implementasi FILTER (filter 'director')
    if (director) {
        whereClauses.push("director = ?");
        queryParams.push(director);
    }

    // Gabungkan semua klausa WHERE
    if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
    }

    // 3. Implementasi SORT (ORDER BY)
    if (sortBy) {
        // Validasi untuk keamanan: hanya izinkan kolom yang aman untuk di-sort
        const safeSortColumns = ["id", "title", "director", "release_year"];
        if (safeSortColumns.includes(sortBy)) {
            query += " ORDER BY ??"; // ?? untuk nama kolom
            queryParams.push(sortBy);
        } else {
            // Abaikan jika kolom tidak aman
            console.warn(
                `Peringatan: Upaya sorting pada kolom tidak valid: ${sortBy}`
            );
        }
    }

    // 4. Eksekusi kueri
    try {
        const [rows] = await pool.query(query, queryParams);
        return rows;
    } catch (err) {
        console.error("DATABASE ERROR [getMovies]:", err);
        throw err;
    }
}

/**
 * SERVICE: Mengambil SATU movie berdasarkan ID
 */
export async function getMovie(id) {
    const [rows] = await pool.query(
        `
    SELECT * FROM movies 
    WHERE id = ?
  `,
        [id]
    );
    return rows[0]; // Kembalikan satu objek saja
}

/**
 * SERVICE: Membuat movie baru
 */
export async function createMovie(title, director, release_year) {
    const [result] = await pool.query(
        `
    INSERT INTO movies (title, director, release_year) 
    VALUES (?, ?, ?)
  `,
        [title, director, release_year]
    );

    const id = result.insertId;
    return getMovie(id); // Kembalikan data utuh yang baru dibuat
}

/**
 * SERVICE: Mengubah movie berdasarkan ID
 */
export async function updateMovie(id, title, director, release_year) {
    const [result] = await pool.query(
        `
    UPDATE movies
    SET title = ?, director = ?, release_year = ?
    WHERE id = ?
  `,
        [title, director, release_year, id]
    );

    if (result.affectedRows === 0) {
        return null; // Menandakan movie tidak ditemukan
    }
    return getMovie(id); // Kembalikan data yang sudah di-update
}

/**
 * SERVICE: Menghapus movie berdasarkan ID
 */
export async function deleteMovie(id) {
    const [result] = await pool.query(
        `
    DELETE FROM movies
    WHERE id = ?
  `,
        [id]
    );

    if (result.affectedRows === 0) {
        return null; // Menandakan movie tidak ditemukan
    }
    return { message: "Movie deleted successfully" };
}
