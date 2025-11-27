import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Muat .env
dotenv.config();

// 1. Konfigurasi "Transporter"
// "kurir" yang akan mengirim email,
// kita gunakan kredensial Ethereal dari .env
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true untuk port 465, false untuk port lain (seperti 587)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * SERVICE: Mengirim Email Verifikasi
 * @param {string} userEmail - Email penerima
 * @param {string} token - Token verifikasi UUID
 */
export async function sendVerificationEmail(userEmail, token) {
    // 2. Buat link verifikasi
    // Di dunia nyata, ini adalah URL frontend
    const verificationLink = `http://localhost:8080/verify-email?token=${token}`;

    // 3. Konfigurasi isi email
    const mailOptions = {
        from: '"Movie App" <noreply@movieapp.com>', // Alamat pengirim
        to: userEmail, // Alamat penerima
        subject: "Selamat Datang! Verifikasi Akun Movie App Anda", // Judul email

        // Isi email (bisa text atau HTML)
        text: `Halo! Terima kasih telah mendaftar. Silakan klik link berikut untuk memverifikasi akun Anda: ${verificationLink}`,
        html: `
      <h1>Selamat Datang di Movie App!</h1>
      <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah untuk memverifikasi akun Anda.</p>
      <a href="${verificationLink}" 
         style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
         Verifikasi Akun Saya
      </a>
      <br><br>
      <p>Jika tombol tidak berfungsi, Anda bisa menyalin link ini:</p>
      <p>${verificationLink}</p>
    `,
    };

    // 4. Kirim email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email verifikasi terkirim: " + info.messageId);

        // link untuk melihat email "palsu" Anda di Ethereal
        console.log("Lihat email di: " + nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.error("Error saat mengirim email:", err);
    }
}
