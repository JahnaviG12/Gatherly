const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gatherly_db');
    console.log("Connected to MongoDB!");
    
    const SpaceSchema = new mongoose.Schema({}, { strict: false });
    const Space = mongoose.model('Space', SpaceSchema, 'spaces');
    
    const space = await Space.findOne({ name: 'trip' });
    if (!space) {
      console.log("Workspace 'trip' not found!");
    } else {
      console.log("Workspace details:");
      console.log("ID:", space._id);
      console.log("Name:", space.name);
      console.log("Members:", JSON.stringify(space.members, null, 2));
    }
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
