const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gatherly_db');
    console.log("Connected to MongoDB!");
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const Space = mongoose.model('Space', new mongoose.Schema({}, { strict: false }), 'spaces');
    
    const users = await User.find({});
    console.log("=== USERS ===");
    users.forEach(u => {
      console.log(`ID: ${u._id}, Username: ${u.username}, Email: ${u.email}`);
    });
    
    const spaces = await Space.find({});
    console.log("\n=== SPACES ===");
    spaces.forEach(s => {
      console.log(`ID: ${s._id}, Name: ${s.name}, Members:`, JSON.stringify(s.members, null, 2));
    });
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
