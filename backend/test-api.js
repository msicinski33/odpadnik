const fetch = require('node-fetch');

async function testContainersAPI() {
  try {
    console.log('=== TESTING CONTAINERS API ===\n');
    
    // First, let's try to get a token by logging in
    console.log('1. Testing login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'michal.sicinski@pgkslupsk.pl',
        password: 'test123' // You might need to change this password
      })
    });
    
    if (!loginResponse.ok) {
      console.log(`❌ Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      const errorText = await loginResponse.text();
      console.log(`Error details: ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log(`   User: ${loginData.user.name} (${loginData.user.role})`);
    console.log(`   Token: ${loginData.token.substring(0, 20)}...`);
    
    // Now test the containers endpoint
    console.log('\n2. Testing containers API...');
    const containersResponse = await fetch('http://localhost:3000/api/containers', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Containers API response: ${containersResponse.status} ${containersResponse.statusText}`);
    
    if (containersResponse.ok) {
      const containersData = await containersResponse.json();
      console.log('✅ Containers API successful');
      console.log(`   Data: ${JSON.stringify(containersData, null, 2)}`);
    } else {
      const errorText = await containersResponse.text();
      console.log(`❌ Containers API failed`);
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testContainersAPI();
