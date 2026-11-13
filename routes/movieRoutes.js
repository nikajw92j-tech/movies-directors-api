const { Router } = require('express')
const {
    createMovie,
    getAllMovies,
    getMovieById,
    updateMovieById,
    deleteMovieById
} = require('../controllers/movieController')

const movieRouter = Router()

movieRouter.post('/', createMovie)
movieRouter.get('/', getAllMovies)
movieRouter.get('/:id', getMovieById)
movieRouter.patch('/:id', updateMovieById)
movieRouter.delete('/:id', deleteMovieById)

module.exports = movieRouter
