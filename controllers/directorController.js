const { isValidObjectId } = require('mongoose')
const Director = require('../models/Director')
const Movie = require('../models/Movie')

// POST /directors
const createDirector = async (req, res, next) => {
    try {
        const { name, age, nationality, birthDate } = req.body || {}

        // check required fields before touching the database
        const missingFields = []
        if (!name) missingFields.push('name')
        if (age === undefined || age === null || age === '') missingFields.push('age')
        if (!nationality) missingFields.push('nationality')
        if (!birthDate) missingFields.push('birthDate')
        if (missingFields.length > 0) {
            return res.status(400).json({ message: 'required fields are missing', missingFields })
        }

        // "movies" is NOT taken from the body - it is filled automatically when movies are created
        const director = await Director.create({ name, age, nationality, birthDate })
        res.status(201).json({ message: 'director created successfully', data: director })
    } catch (error) {
        next(error)
    }
}

// GET /directors
const getAllDirectors = async (req, res, next) => {
    try {
        // populate('movies') replaces movie ids with the full movie documents
        const directors = await Director.find().sort({ _id: -1 }).populate('movies')
        res.json(directors)
    } catch (error) {
        next(error)
    }
}

// GET /directors/:id
const getDirectorById = async (req, res, next) => {
    try {
        const { id } = req.params
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'wrong id is provided' })

        const director = await Director.findById(id).populate('movies')
        if (!director) return res.status(404).json({ message: 'director not found' })

        res.json(director)
    } catch (error) {
        next(error)
    }
}

// PATCH /directors/:id
const updateDirectorById = async (req, res, next) => {
    try {
        const { id } = req.params
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'wrong id is provided' })

        // only these fields can be updated ("movies" is managed by the movie endpoints)
        const { name, age, nationality, birthDate } = req.body || {}
        const updateRequest = {}
        if (name !== undefined) updateRequest.name = name
        if (age !== undefined) updateRequest.age = age
        if (nationality !== undefined) updateRequest.nationality = nationality
        if (birthDate !== undefined) updateRequest.birthDate = birthDate

        if (Object.keys(updateRequest).length === 0) {
            return res.status(400).json({ message: 'nothing to update, send at least one of: name, age, nationality, birthDate' })
        }

        // new: true -> return the updated document
        // runValidators: true -> apply the schema rules (required, min...) on update too
        const updatedDirector = await Director.findByIdAndUpdate(id, updateRequest, { new: true, runValidators: true })
            .populate('movies')
        if (!updatedDirector) return res.status(404).json({ message: 'director not found' })

        res.json({ message: 'director updated successfully', data: updatedDirector })
    } catch (error) {
        next(error)
    }
}

// DELETE /directors/:id
const deleteDirectorById = async (req, res, next) => {
    try {
        const { id } = req.params
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'wrong id is provided' })

        const deletedDirector = await Director.findByIdAndDelete(id)
        if (!deletedDirector) return res.status(404).json({ message: 'director not found' })

        // a movie can not exist without a director, so delete all movies of this director too
        const result = await Movie.deleteMany({ director: id })

        res.json({
            message: 'director and related movies deleted successfully',
            deletedMoviesCount: result.deletedCount,
            data: deletedDirector
        })
    } catch (error) {
        next(error)
    }
}

module.exports = { createDirector, getAllDirectors, getDirectorById, updateDirectorById, deleteDirectorById }
