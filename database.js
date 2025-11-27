import mysql from "mysql2";
import dotenv from "dotenv";

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
 * SERVICE: Mengambil SEMUA movies
 */
// SEBELUM
export async function getMovies() {
    const [rows] = await pool.query("SELECT * FROM movies");
    return rows;
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
