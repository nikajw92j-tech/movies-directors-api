const { isValidObjectId } = require('mongoose')
const Movie = require('../models/Movie')
const Director = require('../models/Director')

// POST /movies
// The director id comes from the "X-Director-Id" HEADER, not from the body
const createMovie = async (req, res, next) => {
    try {
        // 1. read the director id from headers (Express makes all header names lowercase)
        const directorId = req.headers['x-director-id']
        if (!directorId) return res.status(400).json({ message: 'X-Director-Id header is required' })
        if (!isValidObjectId(directorId)) {
            return res.status(400).json({ message: 'wrong director id is provided in X-Director-Id header' })
        }

        // 2. check that the director exists
        const director = await Director.findById(directorId)
        if (!director) return res.status(404).json({ message: 'director not found' })

        // validate required body fields
        const { title, releaseYear, genre, duration } = req.body || {}
        const missingFields = []
        if (!title) missingFields.push('title')
        if (releaseYear === undefined || releaseYear === null || releaseYear === '') missingFields.push('releaseYear')
        if (!genre) missingFields.push('genre')
        if (duration === undefined || duration === null || duration === '') missingFields.push('duration')
        if (missingFields.length > 0) {
            return res.status(400).json({ message: 'required fields are missing', missingFields })
        }

        // 3. create the movie with the director id
        const movie = await Movie.create({ title, releaseYear, genre, duration, director: directorId })

        // 4. add the new movie id to the director's movies array
        await Director.findByIdAndUpdate(directorId, { $push: { movies: movie._id } })

        const populatedMovie = await movie.populate('director')
        res.status(201).json({ message: 'movie created successfully', data: populatedMovie })
    } catch (error) {
        next(error)
    }
}

// GET /movies
const getAllMovies = async (req, res, next) => {
    try {
        // populate('director') replaces the director id with the full director document
        const movies = await Movie.find().sort({ _id: -1 }).populate('director')
        res.json(movies)
    } catch (error) {
        next(error)
    }
}

// GET /movies/:id
const getMovieById = async (req, res, next) => {
    try {
        const { id } = req.params
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'wrong id is provided' })

        const movie = await Movie.findById(id).populate('director')
        if (!movie) return res.status(404).json({ message: 'movie not found' })

        res.json(movie)
    } catch (error) {
        next(error)
    }
}

// PATCH /movies/:id
// To change the director, send the new id in the "X-Director-Id" header (or "director" in the body)
const updateMovieById = async (req, res, next) => {
    try {
        const { id } = req.params
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'wrong id is provided' })

        const movie = await Movie.findById(id)
        if (!movie) return res.status(404).json({ message: 'movie not found' })

        const { title, releaseYear, genre, duration } = req.body || {}
        const updateRequest = {}
        if (title !== undefined) updateRequest.title = title
        if (releaseYear !== undefined) updateRequest.releaseYear = releaseYear
        if (genre !== undefined) updateRequest.genre = genre
        if (duration !== undefined) updateRequest.duration = duration

        // is the director being changed?
        const newDirectorId = req.headers['x-director-id'] || (req.body && req.body.director)
        const oldDirectorId = movie.director.toString()
        let directorChanged = false

        if (newDirectorId) {
            if (!isValidObjectId(newDirectorId)) return res.status(400).json({ message: 'wrong director id is provided' })

            const newDirector = await Director.findById(newDirectorId)
            if (!newDirector) return res.status(404).json({ message: 'new director not found' })

            if (newDirectorId.toString() !== oldDirectorId) {
                updateRequest.director = newDirectorId
                directorChanged = true
            }
        }

        if (Object.keys(updateRequest).length === 0) {
            return res.status(400).json({
                message: 'nothing to update, send at least one of: title, releaseYear, genre, duration, or a new director id'
            })
        }

        const updatedMovie = await Movie.findByIdAndUpdate(id, updateRequest, { new: true, runValidators: true })

        // keep BOTH directors' movies arrays in sync
        if (directorChanged) {
            await Director.findByIdAndUpdate(oldDirectorId, { $pull: { movies: movie._id } })     // remove from old
            await Director.findByIdAndUpdate(newDirectorId, { $addToSet: { movies: movie._id } }) // add to new (no duplicates)
        }

        const populatedMovie = await updatedMovie.populate('director')
        res.json({ message: 'movie updated successfully', data: populatedMovie })
    } catch (error) {
        next(error)
    }
}

// DELETE /movies/:id
const deleteMovieById = async (req, res, next) => {
    try {
        const { id } = req.params
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'wrong id is provided' })

        const deletedMovie = await Movie.findByIdAndDelete(id)
        if (!deletedMovie) return res.status(404).json({ message: 'movie not found' })

        // remove the movie id from its director's movies array
        await Director.findByIdAndUpdate(deletedMovie.director, { $pull: { movies: deletedMovie._id } })

        res.json({ message: 'movie deleted successfully', data: deletedMovie })
    } catch (error) {
        next(error)
    }
}

module.exports = { createMovie, getAllMovies, getMovieById, updateMovieById, deleteMovieById }
