const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";

async function syncEscrow() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const Escrow = mongoose.model('Escrow', new mongoose.Schema({
            sessionId: mongoose.Schema.Types.ObjectId,
            status: String
        }));

        const Session = mongoose.model('Session', new mongoose.Schema({
            escrowStatus: String
        }));

        const escrows = await Escrow.find();
        console.log(`Found ${escrows.length} escrow records.`);

        let updatedCount = 0;
        for (const escrow of escrows) {
            const mappedStatus = escrow.status === 'held' ? 'held' : 
                                 escrow.status === 'released' ? 'released' : 
                                 escrow.status === 'refunded' ? 'refunded' : 'none';
            
            const result = await Session.updateOne(
                { _id: escrow.sessionId },
                { $set: { escrowStatus: mappedStatus } }
            );
            
            if (result.modifiedCount > 0) {
                updatedCount++;
                console.log(`Syncing Session ${escrow.sessionId}: Escrow Status -> ${mappedStatus}`);
            }
        }

        console.log(`\nSync complete. ${updatedCount} sessions updated.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

syncEscrow();
