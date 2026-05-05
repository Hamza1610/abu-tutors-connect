const mongoose = require('mongoose');
const User = require('./backend/src/models/User').default || require('./backend/src/models/User');

async function checkAdmin() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/abututors');
        const admin = await User.findOne({ role: 'admin' });
        console.log('Admin User:', JSON.stringify(admin, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAdmin();
