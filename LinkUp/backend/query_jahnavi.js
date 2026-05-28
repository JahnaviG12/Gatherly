const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gatherly_db');
    console.log("Connected!");
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema, 'users');
    
    const user = await User.findOne({ username: 'jahnavi' });
    console.log("User by username:", JSON.stringify(user, null, 2));
    
    const userByEmail = await User.findOne({ email: 'janu@gmail.com' });
    console.log("User by email:", JSON.stringify(userByEmail, null, 2));
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
