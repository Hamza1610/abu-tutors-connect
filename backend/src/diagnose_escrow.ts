import mongoose from 'mongoose';
import Session from './models/Session';
import Escrow from './models/Escrow';
import Wallet from './models/Wallet';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); // Adjust path if needed

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";

async function diagnose() {
    try {
        console.log('Connecting to:', MONGODB_URI);
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
            } else if (s && s.escrowStatus !== 'held') {
                console.log(`⚠️  Escrow ${e._id} says 'held' but Session ${s._id} says '${s.escrowStatus}'!`);
            }
        }

        await mongoose.connection.close();
    } catch (error: any) {
        console.error('Error during diagnosis:', error.message);
    }
}

diagnose();
