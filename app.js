import express from "express";

// Import semua service "movie"
import {
    getMovies,
    getMovie,
    createMovie,
    updateMovie,
    deleteMovie,
} from "./database.js";

const app = express();
app.use(express.json()); // Middleware untuk parsing JSON

/**
 * ENDPOINT: GET /movies
 * Keterangan: List semua movies
 */
app.get("/movies", async (req, res) => {
    const movies = await getMovies();
    res.send(movies);
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
