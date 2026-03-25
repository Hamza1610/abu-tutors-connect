const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";

async function checkEscrow() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const Escrow = mongoose.model('Escrow', new mongoose.Schema({
            sessionId: mongoose.Schema.Types.ObjectId,
            amount: Number,
            status: String
        }));

        const escrows = await Escrow.find();
        console.log(`Total Escrow Records: ${escrows.length}`);
        
        escrows.forEach(e => {
            console.log(`- Session: ${e.sessionId}, Status: ${e.status}, Amount: ₦${e.amount}, ID: ${e._id}`);
        });

        const held = escrows.filter(e => e.status === 'held');
        console.log(`\nTotal Escrow Held: ₦${held.reduce((acc, e) => acc + (e.amount || 0), 0)}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkEscrow();
