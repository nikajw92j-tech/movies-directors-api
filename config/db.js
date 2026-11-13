const mongoose = require('mongoose')

// Connects to MongoDB using the MONGO_URI from the .env file
const connectToDb = async () => {
    try {
        // MONGO_URI from our .env, or MONGODB_URI which the Vercel + MongoDB Atlas integration creates
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI
        await mongoose.connect(uri)
        console.log('connected to MongoDB successfully')
    } catch (error) {
        console.log('could not connect to MongoDB:', error.message)
        // locally: stop the app - it can not work without a database
        // on Vercel we must not kill the process, the request will just return an error
        if (!process.env.VERCEL) process.exit(1)
    }
}

module.exports = connectToDb
