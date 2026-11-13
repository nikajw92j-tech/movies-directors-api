const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'title is required'],
        trim: true
    },
    releaseYear: {
        type: Number,
        required: [true, 'releaseYear is required'],
        min: [1888, 'releaseYear is too old'] // the first movie ever was made in 1888
    },
    genre: {
        type: String,
        required: [true, 'genre is required'],
        trim: true
    },
    duration: {
        type: Number, // in minutes
        required: [true, 'duration is required'],
        min: [1, 'duration must be at least 1 minute']
    },
    // Each movie belongs to exactly ONE director
    director: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Director',
        required: [true, 'director is required']
    }
}, { timestamps: true })

module.exports = mongoose.model('Movie', movieSchema)
