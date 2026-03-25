const mongoose = require('mongoose');
const Session = require('./models/Session').default;
const Escrow = require('./models/Escrow').default;
const Wallet = require('./models/Wallet').default;

const MONGODB_URI = "mongodb://127.0.0.1:27017/abututors";

async function diagnose() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB\n');

        console.log('--- Checking Sessions with escrowStatus: held ---');
        const sessionsHeld = await Session.find({ escrowStatus: 'held' });
        console.log(`Found ${sessionsHeld.length} sessions as "held" in Session model.`);
        for (const s of sessionsHeld) {
            console.log(`Session ID: ${s._id}, Status: ${s.status}, Amount: ${s.amount}, Topic: ${s.topic}`);
        }

        console.log('\n--- Checking Escrow records with status: held ---');
        const escrowHeld = await Escrow.find({ status: 'held' });
        console.log(`Found ${escrowHeld.length} escrow records as "held" in Escrow model.`);
        for (const e of escrowHeld) {
            console.log(`Escrow ID: ${e._id}, Session ID: ${e.sessionId}, Amount: ${e.amount}`);
        }

        console.log('\n--- Cross-Checking Inconsistencies ---');
        for (const s of sessionsHeld) {
            const e = await Escrow.findOne({ sessionId: s._id });
            if (!e) {
                console.log(`⚠️  Session ${s._id} has escrowStatus: 'held' but NO matching Escrow record!`);
            } else if (e.status !== 'held') {
                console.log(`⚠️  Session ${s._id} says 'held' but Escrow record ${e._id} says '${e.status}'!`);
            }
        }

        for (const e of escrowHeld) {
            const s = await Session.findById(e.sessionId);
            if (!s) {
                console.log(`⚠️  Escrow ${e._id} exists but Session ${e.sessionId} is MISSING!`);
            } else if (s.escrowStatus !== 'held') {
                console.log(`⚠️  Escrow ${e._id} say 'held' but Session ${s._id} says '${s.escrowStatus}'!`);
            }
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error during diagnosis:', error.message);
    }
}

diagnose();
