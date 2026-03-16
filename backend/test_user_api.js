const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log('--- Starting User Profile API Tests ---');
    try {
        // 1. Create a mock tutor
        const testTutor = {
            name: "Test Tutor",
            email: `tutor${Date.now()}@example.com`,
            password: "password123",
            role: "tutor",
            department: "Computer Engineering",
            level: "400L",
            admissionId: "U21CO1015" // Valid ABU ID format
        };

        console.log(`\nRegistering new tutor: ${testTutor.email}`);
        const regRes = await axios.post(`${API_URL}/auth/register`, testTutor);
        console.log('✅ Registration successful. User ID:', regRes.data.user.id);
        
        const token = regRes.data.token;
        const tutorId = regRes.data.user.id;

        // 2. Login to verify token works
        console.log('\nLogging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: testTutor.email,
            password: testTutor.password
        });
        console.log('✅ Login successful.');

        const authConfig = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 3. Get Own Profile
        console.log('\nFetching own profile...');
        const profileRes = await axios.get(`${API_URL}/users/`, authConfig);
        console.log(`✅ Profile fetched: ${profileRes.data.name} (${profileRes.data.role})`);

        // 4. Update Profile
        console.log('\nUpdating profile...');
        const updateRes = await axios.put(`${API_URL}/users/`, {
            about: "I am a test tutor for Day 4.",
            courses: ["COEN453", "CCSN"] // updating specific tutor fields
        }, authConfig);
        console.log(`✅ Profile updated. New about: "${updateRes.data.about}"`);

        // 5. Get Public Tutor Profile Details
        console.log('\nFetching public tutor profile...');
        const publicTutorRes = await axios.get(`${API_URL}/users/tutors/${tutorId}`);
        console.log(`✅ Public Tutor Profile fetched successfully: ${publicTutorRes.data.name}`);

        console.log('\n--- 🎉 All User Profile API Tests Passed! 🎉 ---');

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
