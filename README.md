# Backend Movie API (Advanced)

Proyek ini adalah sebuah REST API komprehensif yang dibangun menggunakan Node.js dan Express.js. API ini tidak hanya mengelola data film (CRUD), tetapi juga mencakup fungsionalitas backend tingkat lanjut termasuk autentikasi pengguna, verifikasi email, pencarian, dan unggah file.

## ✨ Fitur Utama

-   **CRUD Movies**: Fungsionalitas dasar Create, Read, Update, Delete untuk data film.
-   **Autentikasi Pengguna**: Sistem registrasi dan login yang aman menggunakan **JWT** (JSON Web Tokens).
-   **Password Hashing**: Password pengguna di-hash menggunakan **bcrypt** sebelum disimpan.
-   **Middleware Autentikasi**: _Endpoint_ yang sensitif (seperti melihat film) dilindungi oleh _middleware_ autentikasi.
-   **Searching, Sorting, and Filtering**: _Endpoint_ `GET /movies` mendukung _query params_ untuk _search_, _sort_, dan _filter_.
-   **Verifikasi Email**: Pengguna baru menerima email verifikasi (menggunakan **Nodemailer** dan **Ethereal**) setelah mendaftar.
-   **Upload File**: _Endpoint_ terproteksi untuk mengunggah gambar (menggunakan **Multer**).

## 🚀 Teknologi yang Digunakan

-   **Node.js**: Lingkungan eksekusi JavaScript di sisi server.
-   **Express.js**: Kerangka kerja web untuk Node.js.
-   **MySQL2**: Driver MySQL modern untuk Node.js.
-   **dotenv**: Modul untuk memuat variabel lingkungan.
-   **bcrypt**: Library untuk _hashing_ password.
-   **jsonwebtoken**: Library untuk membuat dan memverifikasi token JWT.
-   **nodemailer**: Modul untuk mengirim email.
-   **uuid**: Untuk membuat token verifikasi yang unik.
-   **multer**: _Middleware_ untuk menangani `multipart/form-data` (upload file).

---

## 🛠️ Cara Menjalankan Proyek

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek di lingkungan lokal Anda.

### 1. Clone Repositori

```bash
git clone https://github.com/whyu07/fsd-Advanced-mission1-Backend.git
cd fsd-Advanced-mission1-Backend
```

### 2. Instalasi Dependensi

```bash
npm install
```

### 3. Konfigurasi Environment (.env)

Buat file `.env` dengan menyalin dari file `.env.example`.

```bash
# Untuk pengguna Linux/macOS
cp .env.example .env

# Untuk pengguna Windows
copy .env.example .env
```

Selanjutnya, buka file `.env` dan sesuaikan isinya. File ini berisi SEMUA konfigurasi yang dibutuhkan, termasuk database, JWT, dan email.

```dotenv
# MySQL database configuration
MYSQL_HOST=127.0.0.1
MYSQL_USER=root
MYSQL_PASSWORD="SesuaikanPasswordAnda"
MYSQL_DATABASE=movie_app_db

# JSON Web Token Secret Key
JWT_SECRET="topsecretkey"

# Nodemailer (Ethereal test account)
# Dapatkan kredensial Anda dengan mengikuti instruksi di emailService.js
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER="user-ethereal-anda@ethereal.email"
EMAIL_PASS="password-ethereal-anda"
```

**Catatan tentang Email**: Untuk pengujian email, kami menggunakan Ethereal. Anda bisa mendapatkan kredensial email palsu Anda sendiri dengan menjalankan skrip singkat (lihat instruksi di `emailService.js`).
**Catatan tentang Email**: (lihat di `database.js`) untuk membuat akun Ethereal ,lalu nonaktifkan lagi func nya bila sudah membuat email


### 4. Setup Database (MySQL)

Proyek ini memerlukan server MySQL yang berjalan (misal dari XAMPP).

1.  **Buat Database**: Buka phpMyAdmin, lalu buat database baru dengan nama `movie_app_db`.
2.  **Buat Tabel**: Jalankan query SQL berikut untuk membuat tabel `movies` DAN tabel `users`.

```sql
-- 1. Gunakan database
USE movie_app_db;

-- 2. Buat tabel 'movies'
CREATE TABLE movies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  director VARCHAR(255),
  release_year INT
);

-- 3. Isi data awal 'movies'
INSERT INTO movies (title, director, release_year)
VALUES
('The Shawshank Redemption', 'Frank Darabont', 1994),
('The Godfather', 'Francis Ford Coppola', 1972),
('The Dark Knight', 'Christopher Nolan', 2008);

-- 4. Buat tabel 'users'
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    verification_token VARCHAR(255) NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Buat Folder `upload`

API ini memerlukan folder upload untuk menyimpan file yang diunggah. Buatlah di root proyek.

```bash
mkdir upload
```

### 6. Jalankan Server

Untuk mode development (dengan auto-reload):

```bash
npm run dev
```

Untuk mode produksi:

```bash
npm start
```

Server akan berjalan di `http://localhost:8080`.

## 🗺️ API Endpoints

Berikut adalah daftar endpoint utama yang tersedia.

### Autentikasi & Pengguna

| Method | Endpoint        | Keterangan                                | Body (Payload)                                    |
| :----- | :-------------- | :---------------------------------------- | :------------------------------------------------ |
| `POST` | `/register`     | Mendaftarkan pengguna baru.               | `{ "fullname", "username", "email", "password" }` |
| `POST` | `/login`        | Login pengguna dan mendapatkan token JWT. | `{ "email", "password" }`                         |
| `GET`  | `/verify-email` | Memverifikasi email pengguna.             | `?token=...` (Query Param)                        |

### Movies (CRUD)

| Method   | Endpoint     | Proteksi    | Keterangan                                                                 |
| :------- | :----------- | :---------- | :------------------------------------------------------------------------- |
| `GET`    | `/movies`    | Terproteksi | Mendapat daftar semua film. Mendukung `?search=`, `?sortBy=`, `?director=` |
| `GET`    | `/movie/:id` | Publik      | Mendapat detail satu film berdasarkan ID.                                  |
| `POST`   | `/movie`     | Publik      | Menambahkan film baru.                                                     |
| `PATCH`  | `/movie/:id` | Publik      | Memperbarui film berdasarkan ID.                                           |
| `DELETE` | `/movie/:id` | Publik      | Menghapus film berdasarkan ID.                                             |

### File Upload

| Method | Endpoint  | Proteksi    | Keterangan                                                         |
| :----- | :-------- | :---------- | :----------------------------------------------------------------- |
| `POST` | `/upload` | Terproteksi | Mengunggah file gambar. Menggunakan `form-data` dengan key `file`. |


[Koleksi Postman Movie API](https://www.postman.com/wahyu-1903801/workspace/movie-app/collection/47821006-2ad09c5c-69e8-4f05-967e-1969d0bbb0f5?action=share&creator=47821006&active-environment=47821006-89d75c6a-e714-41dc-8fe8-cb7cb42f8a4b)