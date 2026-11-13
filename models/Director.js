const mongoose = require('mongoose')

const directorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true
    },
    age: {
        type: Number,
        required: [true, 'age is required'],
        min: [0, 'age can not be negative']
    },
    nationality: {
        type: String,
        required: [true, 'nationality is required'],
        trim: true
    },
    birthDate: {
        type: Date,
        required: [true, 'birthDate is required']
    },
    // One-to-Many: one director -> many movies
    movies: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Movie',
        default: []
    }
}, { timestamps: true })

module.exports = mongoose.model('Director', directorSchema)
