const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Space = require('./models/Space');

async function initializeDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gatherly_db');
        
        console.log('Successfully connected to:', mongoose.connection.name);
        console.log('Creating database and collections...');

        // Explicitly create collections so the database appears in MongoDB Compass immediately
        await User.createCollection();
        await Space.createCollection();

        console.log('✅ Success! The new database "gatherly_db" has been created.');
        console.log('You can now see it in MongoDB Compass.');
        
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase();
