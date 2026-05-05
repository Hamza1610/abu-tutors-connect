const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/src/models/User').default || require('./backend/src/models/User');

async function testLogin() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/abututors');
        const email = 'admin@abututors.com';
        const password = 'Password123!'; // I'm guessing this is the password based on standard patterns or if I saw it before
        // Actually I don't know the password. 
        // I will just check if the user exists and what the hash looks like.
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log('User not found:', email);
        } else {
            console.log('User found:', user.email);
            console.log('Role:', user.role);
            console.log('Password hash exists:', !!user.password);
            console.log('Password type:', typeof user.password);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testLogin();
