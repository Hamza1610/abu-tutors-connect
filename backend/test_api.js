const test = async () => {
    try {
        console.log('Testing Registration...');
        const regRes = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Node Tester', email: 'nodetst1@abu.edu.ng', password: 'password', role: 'tutee' })
        });
        const regData = await regRes.json();
        console.log('Register Response:', regData);

        console.log('\nTesting Login...');
        const logRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'nodetst1@abu.edu.ng', password: 'password' })
        });
        const logData = await logRes.json();
        console.log('Login Response:', logData);
    } catch (e) {
        console.error('Test Failed:', e);
    }
};
test();
