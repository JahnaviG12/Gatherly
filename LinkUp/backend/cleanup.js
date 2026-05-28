const mongoose = require('mongoose');
const Space = require('./models/Space');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gatherly_db').then(async () => {
  const spaces = await Space.find({});
  const seenFrontendIds = new Set();
  const seenNames = new Set();
  let deletedCount = 0;
  
  for (const s of spaces) {
    const rawDoc = s.toObject(); // Get the raw object without virtuals
    const frontendId = rawDoc.id; // This will be the frontend string ID if it exists
    
    let isDuplicate = false;
    
    if (frontendId) {
       if (seenFrontendIds.has(frontendId)) isDuplicate = true;
       else seenFrontendIds.add(frontendId);
    } else {
       if (seenNames.has(s.name)) isDuplicate = true;
       else seenNames.add(s.name);
    }
    
    if (isDuplicate) {
      await Space.findByIdAndDelete(s._id);
      deletedCount++;
    }
  }
  console.log('Deleted ' + deletedCount + ' duplicates.');
  process.exit(0);
});
