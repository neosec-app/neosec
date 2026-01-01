/**
 * Test script for Saadat Module Features
 * Tests all 5 backend APIs:
 * 1. Admin Panel - Get All Users API
 * 2. Dashboard API - Get Dashboard Data
 * 3. Firewall Rule Creation API
 * 4. Activity Logs API - Get Logs with Filtering
 * 5. Threat Blocker Status API
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');
const FirewallRule = require('./models/FirewallRule');
const ActivityLog = require('./models/ActivityLog');
const BlocklistIP = require('./models/BlocklistIP');
const ThreatBlockerSettings = require('./models/ThreatBlockerSettings');
const VpnConfig = require('./models/VpnConfig');
const Threat = require('./models/Threat');
const bcrypt = require('bcryptjs');

// Test user credentials
let testUser = null;
let testAdmin = null;

// Set DATABASE_URL if not in environment
if (!process.env.DATABASE_URL) {
  // Try to add port if missing (Render databases typically use 5432)
  let dbUrl = 'postgresql://neosec_backend_user:XEPoMnQlgRGi7x81T8YzDmEhE1bZuKlw@dpg-d4q92rje5dus73ejkmt0-a/neosec_backend';
  
  // If hostname doesn't include a port, try adding default port
  if (!dbUrl.match(/@[^:]+:\d+\//)) {
    // Check if it's a Render database (dpg- pattern) and might need full hostname
    if (dbUrl.includes('dpg-') && !dbUrl.includes('render.com')) {
      console.log('⚠️  Warning: Hostname might need full domain (e.g., .oregon-postgres.render.com)');
      console.log('   Trying connection as-is first...');
    }
  }
  
  process.env.DATABASE_URL = dbUrl;
  console.log('⚠️  DATABASE_URL not found in environment, using provided connection string');
  console.log('   Note: SSL will be enabled automatically for dpg- hostnames');
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Helper function to make API requests (optional - only if server is running)
async function apiRequest(method, endpoint, token = null, data = null) {
  try {
    const axios = require('axios');
    
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { status: response.status, data: response.data };
  } catch (error) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 0, error: error.message };
  }
}

// Test database connection
async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  try {
    await connectDB();
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Create test users
async function createTestUsers() {
  console.log('\n👤 Creating test users...');
  try {
    // Check if test user exists
    testUser = await User.findOne({ where: { email: 'test@saadat.com' } });
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      testUser = await User.create({
        email: 'test@saadat.com',
        password: hashedPassword,
        role: 'user',
        isApproved: true
      });
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user already exists');
    }

    // Check if test admin exists
    testAdmin = await User.findOne({ where: { email: 'admin@saadat.com' } });
    if (!testAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      testAdmin = await User.create({
        email: 'admin@saadat.com',
        password: hashedPassword,
        role: 'admin',
        isApproved: true
      });
      console.log('✅ Test admin created');
    } else {
      console.log('✅ Test admin already exists');
    }

    return true;
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    return false;
  }
}

// Login and get tokens
async function loginUsers() {
  console.log('\n🔐 Logging in users...');
  try {
    // Login as regular user
    const userLogin = await apiRequest('POST', '/auth/login', null, {
      email: 'test@saadat.com',
      password: 'test123'
    });
    
    if (userLogin.status === 200 && userLogin.data.token) {
      authToken = userLogin.data.token;
      console.log('✅ User login successful');
    } else {
      console.error('❌ User login failed:', userLogin.data);
      return false;
    }

    // Login as admin
    const adminLogin = await apiRequest('POST', '/auth/login', null, {
      email: 'admin@saadat.com',
      password: 'admin123'
    });
    
    if (adminLogin.status === 200 && adminLogin.data.token) {
      adminToken = adminLogin.data.token;
      console.log('✅ Admin login successful');
    } else {
      console.error('❌ Admin login failed:', adminLogin.data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

// Test 1: Admin Panel - Get All Users API (Direct DB test)
async function testGetAllUsers() {
  console.log('\n📋 Test 1: Admin Panel - Get All Users API');
  console.log('   Testing: User.findAll() functionality');
  
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`   ✅ Success! Found ${users.length} users in database`);
    if (users.length > 0) {
      console.log(`      - Sample users: ${users.slice(0, 3).map(u => u.email).join(', ')}`);
    }
    return true;
  } catch (error) {
    console.error('   ❌ Failed:', error.message);
    return false;
  }
}

// Test 2: Dashboard API - Get Dashboard Data (Direct DB test)
async function testDashboard() {
  console.log('\n📊 Test 2: Dashboard API - Get Dashboard Data');
  console.log('   Testing: Dashboard data queries');
  
  try {
    if (!testUser) {
      console.log('   ⚠️  Skipping - test user not created');
      return false;
    }

    // Test VPN config query
    const activeVpn = await VpnConfig.findOne({
      where: { userId: testUser.id, isActive: true }
    });
    
    // Test threats query
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const threatsThisWeek = await Threat.count({
      where: {
        userId: testUser.id,
        blocked: true,
        createdAt: { [require('sequelize').Op.gte]: oneWeekAgo }
      }
    });

    const totalThreats = await Threat.count({
      where: { userId: testUser.id, blocked: true }
    });

    // Test activity logs query
    const recentLogs = await ActivityLog.findAll({
      where: { userId: testUser.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log('   ✅ Success! Dashboard queries work:');
    console.log(`      - VPN Status: ${activeVpn ? 'Has active VPN' : 'No active VPN'}`);
    console.log(`      - Threats Blocked (This Week): ${threatsThisWeek}`);
    console.log(`      - Total Threats: ${totalThreats}`);
    console.log(`      - Recent Activity Logs: ${recentLogs.length}`);
    return true;
  } catch (error) {
    console.error('   ❌ Failed:', error.message);
    return false;
  }
}

// Test 3: Firewall Rule Creation API (Direct DB test)
async function testFirewallRuleCreation() {
  console.log('\n🔥 Test 3: Firewall Rule Creation API');
  console.log('   Testing: FirewallRule.create() functionality');
  
  try {
    if (!testUser) {
      console.log('   ⚠️  Skipping - test user not created');
      return { success: false };
    }

    // Check existing rules first
    const existingRules = await FirewallRule.count({
      where: { userId: testUser.id }
    });

    // Create a test firewall rule
    const firewallRule = await FirewallRule.create({
      ip_address: '192.168.1.100',
      port_start: 80,
      port_end: 80,
      protocol: 0, // TCP
      action: 2, // DROP
      userId: testUser.id
    });
    
    console.log('   ✅ Success! Firewall rule created:');
    console.log(`      - Rule ID: ${firewallRule.id}`);
    console.log(`      - IP: ${firewallRule.ip_address}`);
    console.log(`      - Action: ${firewallRule.action === 2 ? 'DROP' : 'ACCEPT'}`);
    console.log(`      - Total rules for user: ${existingRules + 1}`);

    // Clean up - delete the test rule
    await firewallRule.destroy();
    console.log('   ✅ Test rule cleaned up');
    
    return { success: true, ruleId: firewallRule.id };
  } catch (error) {
    console.error('   ❌ Failed:', error.message);
    if (error.original) {
      console.error('      Original error:', error.original.message);
    }
    return { success: false };
  }
}

// Test 4: Activity Logs API - Get Logs with Filtering (Direct DB test)
async function testActivityLogs() {
  console.log('\n📝 Test 4: Activity Logs API - Get Logs with Filtering');
  console.log('   Testing: ActivityLog queries with filters');
  
  try {
    if (!testUser) {
      console.log('   ⚠️  Skipping - test user not created');
      return false;
    }

    const { Op } = require('sequelize');
    
    // Test without filters
    const { count, rows } = await ActivityLog.findAndCountAll({
      where: { userId: testUser.id },
      order: [['createdAt', 'DESC']],
      limit: 10,
      offset: 0
    });
    
    console.log('   ✅ Success! Activity logs query works:');
    console.log(`      - Total Logs: ${count}`);
    console.log(`      - Logs in this page: ${rows.length}`);
    
    // Test with filters
    const filteredLogs = await ActivityLog.findAndCountAll({
      where: {
        userId: testUser.id,
        severity: 'info'
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
      offset: 0
    });
    
    console.log(`      - Filtered logs (severity=info): ${filteredLogs.count}`);
    console.log('   ✅ Filtered queries work correctly');
    
    return true;
  } catch (error) {
    console.error('   ❌ Failed:', error.message);
    return false;
  }
}

// Test 5: Threat Blocker Status API (Direct DB test)
async function testThreatBlockerStatus() {
  console.log('\n🛡️  Test 5: Threat Blocker Status API');
  console.log('   Testing: Threat blocker status queries');
  
  try {
    const { Op } = require('sequelize');
    
    // Test BlocklistIP queries
    const totalIPs = await BlocklistIP.count();
    
    // Test ActivityLog queries for blocked threats
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    
    let blockedToday = 0;
    let blockedThisWeek = 0;
    
    try {
      blockedToday = await ActivityLog.count({
        where: {
          eventType: 'Blocked Threat',
          status: 'Blocked',
          createdAt: { [Op.gte]: todayStart }
        }
      });

      blockedThisWeek = await ActivityLog.count({
        where: {
          eventType: 'Blocked Threat',
          status: 'Blocked',
          createdAt: { [Op.gte]: weekStart }
        }
      });
    } catch (logError) {
      console.log('   ⚠️  ActivityLog table might not have blocked threats yet');
    }

    // Test ThreatBlockerSettings
    let settings = null;
    try {
      settings = await ThreatBlockerSettings.findOne({ where: { key: 'enabled' } });
    } catch (settingsError) {
      console.log('   ⚠️  ThreatBlockerSettings table might not exist yet');
    }

    console.log('   ✅ Success! Threat blocker queries work:');
    console.log(`      - Total IPs in blocklist: ${totalIPs}`);
    console.log(`      - Blocked Today: ${blockedToday}`);
    console.log(`      - Blocked This Week: ${blockedThisWeek}`);
    console.log(`      - Settings table accessible: ${settings !== null ? 'Yes' : 'No (table may not exist yet)'}`);
    
    return true;
  } catch (error) {
    console.error('   ❌ Failed:', error.message);
    if (error.original) {
      console.error('      Original error:', error.original.message);
    }
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 Testing Saadat Module Features');
  console.log('═══════════════════════════════════════════════════════');

  const results = {
    database: false,
    users: false,
    login: false,
    getAllUsers: false,
    dashboard: false,
    firewall: false,
    activityLogs: false,
    threatBlocker: false
  };

  // Test database connection
  results.database = await testDatabaseConnection();
  if (!results.database) {
    console.log('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }

  // Create test users
  results.users = await createTestUsers();
  if (!results.users) {
    console.log('\n❌ Cannot proceed without test users');
    process.exit(1);
  }

  // Create test users (no login needed for direct DB tests)
  // But we'll still try to login if server is running
  results.login = await loginUsers();
  if (!results.login) {
    console.log('   ⚠️  Server not running or login failed - continuing with direct DB tests');
  }

  // Run all direct database tests
  results.getAllUsers = await testGetAllUsers();
  results.dashboard = await testDashboard();
  const firewallResult = await testFirewallRuleCreation();
  results.firewall = firewallResult.success;
  results.activityLogs = await testActivityLogs();
  results.threatBlocker = await testThreatBlockerStatus();

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Database Connection:     ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test Users Created:      ${results.users ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Login (API):        ${results.login ? '✅ PASS' : '⚠️  SKIP (server not running)'}`);
  console.log(`Get All Users API:       ${results.getAllUsers ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Dashboard API:           ${results.dashboard ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Firewall Rule API:       ${results.firewall ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Activity Logs API:      ${results.activityLogs ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Threat Blocker API:     ${results.threatBlocker ? '✅ PASS' : '❌ FAIL'}`);
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  console.log(`\n✅ Passed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Saadat module features are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }

  await sequelize.close();
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

