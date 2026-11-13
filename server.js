const express = require('express')
const dotenv = require('dotenv')
dotenv.config() // loads variables from .env into process.env

const connectToDb = require('./config/db')
const directorRouter = require('./routes/directorRoutes')
const movieRouter = require('./routes/movieRoutes')

const app = express()
const PORT = process.env.PORT || 3000

connectToDb()

app.use(express.json()) // lets us read JSON from req.body

app.get('/', (req, res) => {
    res.json({ message: 'Movies & Directors API is running' })
})

app.use('/directors', directorRouter)
app.use('/movies', movieRouter)

// 404 - no route matched
app.use((req, res) => {
    res.status(404).json({ message: `route ${req.method} ${req.originalUrl} not found` })
})

// Global error handler - every controller sends its errors here with next(error)
app.use((error, req, res, next) => {
    // Invalid JSON in the request body
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'invalid JSON in request body' })
    }
    // Mongoose schema validation failed (missing required field, min value...)
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message)
        return res.status(400).json({ message: 'validation failed', errors })
    }
    // Wrong type, e.g. "abc" for a Number field
    if (error.name === 'CastError') {
        return res.status(400).json({ message: `invalid value for field "${error.path}"` })
    }

    console.log(error)
    res.status(500).json({ message: 'internal server error' })
})

// On Vercel the platform runs the app for us, so we only call listen() locally
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`server running on http://localhost:${PORT}`)
    })
}

module.exports = app // Vercel needs the exported app
