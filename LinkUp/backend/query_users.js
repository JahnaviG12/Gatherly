const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gatherly_db');
    console.log("Connected to MongoDB!");
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema, 'users');
    
    const users = await User.find({});
    console.log("All Users:", JSON.stringify(users, null, 2));
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
