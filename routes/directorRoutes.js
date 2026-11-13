const { Router } = require('express')
const {
    createDirector,
    getAllDirectors,
    getDirectorById,
    updateDirectorById,
    deleteDirectorById
} = require('../controllers/directorController')

const directorRouter = Router()

directorRouter.post('/', createDirector)
directorRouter.get('/', getAllDirectors)
directorRouter.get('/:id', getDirectorById)
directorRouter.patch('/:id', updateDirectorById)
directorRouter.delete('/:id', deleteDirectorById)

module.exports = directorRouter
