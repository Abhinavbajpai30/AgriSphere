const mongoose = require('mongoose');
const User = require('./models/User');
const axios = require('axios');
require('dotenv').config();

async function testDashboardAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the user details
    const userId = '6891903b3504714928d0cb47';
    const user = await User.findById(userId);
    
    if (user) {
      console.log('User found:', {
        name: user.personalInfo?.firstName,
        phone: user.personalInfo?.phoneNumber,
        email: user.personalInfo?.email
      });

      // Try to login with the actual phone number
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        phoneNumber: user.personalInfo?.phoneNumber || '+919876543210',
        password: 'password123'
      });

      const token = loginResponse.data.data.token;
      console.log('Login successful, token obtained');

      // Test the dashboard endpoint
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Dashboard API Response:');
      console.log('Status:', dashboardResponse.status);
      console.log('Data:', JSON.stringify(dashboardResponse.data, null, 2));

    } else {
      console.log('User not found');
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testDashboardAPI(); 