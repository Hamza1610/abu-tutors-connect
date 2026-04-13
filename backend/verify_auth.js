const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAuth() {
    console.log('--- Auth Test Started ---');

    try {
        // 1. Test registration with weak password
        console.log('\n1. Testing weak password registration...');
        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                name: 'Test Weak',
                email: 'weak' + Date.now() + '@test.com',
                password: 'weak',
                role: 'tutee',
                acceptedTerms: true
            });
            console.log('FAIL: Registered with weak password');
        } catch (err) {
            console.log('PASS: Registration rejected:', err.response?.data?.message);
        }

        // 2. Test registration with strong password
        console.log('\n2. Testing strong password registration...');
        const userEmail = 'strong' + Date.now() + '@test.com';
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test Strong',
            email: userEmail,
            password: 'StrongPassword123!',
            role: 'tutee',
            acceptedTerms: true
        });
        console.log('PASS: Registration successful');

        // 3. Test forgot password
        console.log('\n3. Testing forgot password...');
        const forgotRes = await axios.post(`${BASE_URL}/auth/forgot-password`, {
            email: userEmail
        });
        console.log('PASS: Forgot password request sent (Log will show mock URL)');

        // We can't easily get the token from here without database access, 
        // but we've verified the endpoint responds correctly.
        
        console.log('\nAuth Test Complete!');
    } catch (err) {
        console.error('Test Failed:', err.response?.data || err.message);
    }
}

testAuth();
