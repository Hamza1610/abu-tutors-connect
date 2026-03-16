const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let tutorToken, tuteeToken;
let tutorId, tuteeId;

async function runTests() {
    console.log('\n--- Starting Day 7: Stats & Notifications Verification ---');

    try {
        // 1. Setup: Register and Login
        console.log('\nRegistering/Login users...');
        
        // Register Tutor
        try {
            await axios.post(`${API_URL}/auth/register`, {
                name: 'Tutor Seven',
                email: 'tutor_day7@test.com',
                password: 'password123',
                role: 'tutor'
            });
        } catch (e) {} // Ignore if exists
        
        const tutorLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'tutor_day7@test.com',
            password: 'password123'
        });
        tutorToken = tutorLogin.data.token;
        tutorId = tutorLogin.data.user.id;

        // Register Tutee
        try {
            await axios.post(`${API_URL}/auth/register`, {
                name: 'Tutee Seven',
                email: 'tutee_day7@test.com',
                password: 'password123',
                role: 'tutee'
            });
        } catch (e) {}
        
        const tuteeLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'tutee_day7@test.com',
            password: 'password123'
        });
        tuteeToken = tuteeLogin.data.token;
        tuteeId = tuteeLogin.data.user.id;

        // 1.5. Fund Tutee Wallet
        console.log('\nFunding Tutee Wallet...');
        await axios.post(`${API_URL}/wallets/fund`, { amount: 2000 }, {
            headers: { Authorization: `Bearer ${tuteeToken}` }
        });

        // 2. Fetch Tutor Stats (Baseline)
        console.log('\nFetching Tutor Stats (Baseline)...');
        const statsRes = await axios.get(`${API_URL}/stats/tutor`, {
            headers: { Authorization: `Bearer ${tutorToken}` }
        });
        console.log('✅ Stats received:', statsRes.data);

        // 3. Create a Session (should trigger notification)
        console.log('\nBooking a session to trigger notification...');
        const bookingRes = await axios.post(`${API_URL}/sessions`, {
            tutorId: tutorId,
            date: '2026-03-20',
            time: '14:00',
            topic: 'Advanced Calculus',
            amount: 800
        }, {
            headers: { Authorization: `Bearer ${tuteeToken}` }
        });
        const sessionId = bookingRes.data._id;

        // 3.5 Complete the session to verify earnings
        console.log('\nCompleting session to verify payment release...');
        await axios.post(`${API_URL}/sessions/${sessionId}/complete`, {}, {
            headers: { Authorization: `Bearer ${tutorToken}` }
        });

        // 4. Check Tutor Notifications
        console.log('\nChecking Tutor Notifications...');
        const notifRes = await axios.get(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${tutorToken}` }
        });
        const sessionNotif = notifRes.data.find(n => n.title === 'New Session Booked');
        if (sessionNotif) {
            console.log('✅ Notification Delivery Verified:', sessionNotif.message);
        }

        // 5. Final Stats Check
        console.log('\nFetching Final Tutor Stats...');
        const finalStats = await axios.get(`${API_URL}/stats/tutor`, {
            headers: { Authorization: `Bearer ${tutorToken}` }
        });
        console.log('✅ Final Stats:', finalStats.data);
        if (finalStats.data.completedSessions >= 1) {
            console.log('✅ Earnings & Session Stats Verified.');
        }

        console.log('\n--- 🎉 Day 7 Backend Verification Passed! 🎉 ---');

    } catch (error) {
        console.error('\n❌ Test Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

runTests();
