const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";

async function checkEscrow() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        // Register User model first
        mongoose.model('User', new mongoose.Schema({ name: String }));

        const Session = mongoose.model('Session', new mongoose.Schema({
            tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            topic: String,
            amount: Number,
            status: String,
            escrowStatus: String
        }));

        const sessions = await Session.find().populate('tutorId');
        console.log(`Total Sessions: ${sessions.length}`);
        
        sessions.forEach(s => {
            console.log(`- Topic: ${s.topic}, Status: ${s.status}, Escrow: ${s.escrowStatus}, Amount: ₦${s.amount}, ID: ${s._id}, Tutor: ${s.tutorId ? s.tutorId.name : 'Unknown'}`);
        });

        const held = sessions.filter(s => s.escrowStatus === 'held');
        console.log(`\nTotal Escrow Held: ₦${held.reduce((acc, s) => acc + (s.amount || 0), 0)}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkEscrow();
