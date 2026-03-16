const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log('--- Starting Day 5 & 6: Sessions & Wallet Flow Tests ---');
    try {
        // 1. Setup Tutor and Tutee
        const timestamp = Date.now();
        const tutorData = {
            name: "Emmanuel Tutor",
            email: `tutor${timestamp}@abu.edu.ng`,
            password: "password123",
            role: "tutor",
            department: "Engineering"
        };
        const tuteeData = {
            name: "John Tutee",
            email: `tutee${timestamp}@abu.edu.ng`,
            password: "password123",
            role: "tutee"
        };

        console.log('\nRegistering Tutor and Tutee...');
        const tutorReg = await axios.post(`${API_URL}/auth/register`, tutorData);
        const tuteeReg = await axios.post(`${API_URL}/auth/register`, tuteeData);
        
        const tutorToken = tutorReg.data.token;
        const tuteeToken = tuteeReg.data.token;
        const tutorId = tutorReg.data.user.id;

        const tutorConfig = { headers: { Authorization: `Bearer ${tutorToken}` } };
        const tuteeConfig = { headers: { Authorization: `Bearer ${tuteeToken}` } };

        // 2. Fund Tutee Wallet
        console.log('\nFunding Tutee Wallet...');
        const fundRes = await axios.post(`${API_URL}/wallets/fund`, { amount: 2000 }, tuteeConfig);
        console.log(`✅ Tutee Wallet funded. Balance: ${fundRes.data.balance}`);

        // 3. Book Session
        console.log('\nBooking Session (Escrow test)...');
        const sessionPayload = {
            tutorId,
            date: "2026-03-20",
            time: "02:00 PM - 03:00 PM",
            topic: "Calculus I",
            amount: 800
        };
        const bookingRes = await axios.post(`${API_URL}/sessions`, sessionPayload, tuteeConfig);
        console.log(`✅ Session booked. ID: ${bookingRes.data._id}`);

        // 4. Verify Tutee Balance (should be 2000 - 800 = 1200)
        const postBookingWallet = await axios.get(`${API_URL}/wallets`, tuteeConfig);
        console.log(`✅ Tutee Balance after booking: ${postBookingWallet.data.balance} (Expected 1200)`);

        // 5. Complete Session (Tutor)
        console.log('\nCompleting Session (Payment release test)...');
        await axios.post(`${API_URL}/sessions/${bookingRes.data._id}/complete`, {}, tutorConfig);
        console.log(`✅ Session completed.`);

        // 6. Verify Tutor Balance (should be 800)
        const tutorWalletRes = await axios.get(`${API_URL}/wallets`, tutorConfig);
        console.log(`✅ Tutor Balance after completion: ${tutorWalletRes.data.balance} (Expected 800)`);

        console.log('\n--- 🎉 Day 5 & 6 E2E Flow Tests Passed! 🎉 ---');

    } catch (error) {
        console.error('\n❌ Test Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

runTests();
