# Saadat Modules - Complete Postman API Calls Guide

## How to Use This Guide

This guide contains all API endpoints for Saadat modules with:
- HTTP Method (GET, POST, PUT, DELETE)
- Complete URL
- Required Headers
- Request Body (if needed)
- Expected Response
- Example values

---

## Setup: Getting Your JWT Token

**Before testing any API, you need to login first:**

### 1. Login to Get JWT Token

**Method:** `POST`  
**URL:** `http://localhost:5000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@test.com",
  "password": "your_password"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "admin@test.com",
    "role": "admin"
  }
}
```

**Important:** Copy the `token` value and use it in all subsequent requests!

---

## Module 1: Admin Panel & User Management

### 1. Get All Users

**Method:** `GET`  
**URL:** `http://localhost:5000/api/admin/users`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters (Optional):**
- `page=1` - Page number (default: 1)
- `limit=50` - Users per page (default: 50)
- `role=user` - Filter by role (user/admin/all)
- `isApproved=true` - Filter by approval status (true/false)
- `search=john` - Search in email, name, phone
- `sortBy=createdAt` - Sort field (createdAt/email/role)
- `sortOrder=DESC` - Sort direction (ASC/DESC)

**Example URL with Parameters:**
```
http://localhost:5000/api/admin/users?page=1&limit=20&role=user&search=john&sortBy=email&sortOrder=ASC
```

**Expected Response:**
```json
{
  "success": true,
  "count": 150,
  "data": {
    "users": [
      {
        "id": "123",
        "email": "user1@test.com",
        "role": "user",
        "isApproved": true,
        "accountType": "member",
        "createdAt": "2024-01-15T10:00:00Z"
      }
      // ... more users
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

---

### 2. Get User By ID

**Method:** `GET`  
**URL:** `http://localhost:5000/api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Example URL:**
```
http://localhost:5000/api/admin/users/123
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "user@test.com",
    "role": "user",
    "vpnConfigs": [
      {
        "id": "456",
        "name": "US Server",
        "isActive": true,
        "protocol": "OpenVPN"
      }
    ],
    "threats": [
      {
        "id": "789",
        "threatType": "malware",
        "severity": "critical",
        "blocked": true,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 3. Update User

**Method:** `PUT`  
**URL:** `http://localhost:5000/api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Body (JSON) - All fields optional:**
```json
{
  "email": "newemail@test.com",
  "role": "admin",
  "isApproved": true
}
```

**Example URL:**
```
http://localhost:5000/api/admin/users/123
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "newemail@test.com",
    "role": "admin",
    "isApproved": true,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### 4. Delete User

**Method:** `DELETE`  
**URL:** `http://localhost:5000/api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Example URL:**
```
http://localhost:5000/api/admin/users/123
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 5. Get Admin Statistics

**Method:** `GET`  
**URL:** `http://localhost:5000/api/admin/statistics`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "admins": 5,
      "regularUsers": 145,
      "pendingApprovals": 10
    },
    "vpn": {
      "totalConfigs": 200,
      "activeConfigs": 50
    },
    "threats": {
      "totalBlocked": 5000,
      "last24Hours": 25,
      "bySeverity": [
        { "severity": "critical", "count": "1000" },
        { "severity": "high", "count": "2000" }
      ]
    },
    "applicationHealth": {
      "status": "healthy",
      "uptime": 86400,
      "timestamp": "2024-01-15T12:00:00Z"
    }
  }
}
```

---

## Module 1: Dashboard & Status Monitoring

### 6. Get Dashboard Data

**Method:** `GET`  
**URL:** `http://localhost:5000/api/dashboard`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "vpnStatus": {
      "connected": true,
      "configId": "123",
      "server": "1.2.3.4",
      "protocol": "OpenVPN",
      "configName": "US Server",
      "serverLocation": "United States",
      "ipAddress": "1.2.3.4",
      "connectionTime": "2h 30m"
    },
    "threatsBlocked": {
      "thisWeek": 75,
      "percentageChange": 50,
      "totalBlockedIPs": 25,
      "totalBlocklistIPs": 10000,
      "last24Hours": 10,
      "total": 500
    },
    "activeProfile": {
      "name": "High Security",
      "description": "Maximum protection enabled",
      "profileType": "high_security"
    },
    "dataTransfer": {
      "bytesSent": 5368709120,
      "bytesReceived": 2147483648,
      "gbSent": 5.0,
      "gbReceived": 2.0,
      "sentPercentage": 50.0,
      "receivedPercentage": 20.0
    },
    "recentActivities": [
      {
        "id": "1",
        "message": "Blocked connection from threat IP: 192.168.1.100",
        "timestamp": "2024-01-15T10:00:00Z",
        "timeAgo": "2 hours ago",
        "isBlocked": true
      }
      // ... more activities
    ],
    "activeUsers": [
      {
        "id": "456",
        "email": "user@example.com",
        "role": "user",
        "isActive": true,
        "statusText": "now"
      }
      // ... more users
    ]
  }
}
```

---

## Module 2: Firewall Rule Management

### 7. Get All Firewall Rules

**Method:** `GET`  
**URL:** `http://localhost:5000/api/firewall`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "456",
      "ip_address": "192.168.1.100",
      "port_start": 80,
      "port_end": 80,
      "protocol": 0,
      "action": 1,
      "direction": "inbound",
      "userId": "123",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
    // ... more rules
  ]
}
```

**Note:** Protocol values: 0=TCP, 1=UDP, 2=BOTH  
**Note:** Action values: 0=ACCEPT, 1=REJECT, 2=DROP

---

### 8. Create Firewall Rule

**Method:** `POST`  
**URL:** `http://localhost:5000/api/firewall`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "ip_address": "192.168.1.100",
  "port_start": 80,
  "port_end": 80,
  "protocol": 0,
  "action": 1,
  "direction": "inbound"
}
```

**Field Descriptions:**
- `ip_address` (required): IP address to block/allow (e.g., "192.168.1.100")
- `port_start` (optional): Starting port number (0-65535, null for all ports)
- `port_end` (optional): Ending port number (0-65535, null for all ports)
- `protocol` (required): 0=TCP, 1=UDP, 2=BOTH
- `action` (required): 0=ACCEPT, 1=REJECT, 2=DROP
- `direction` (optional): "inbound" or "outbound" (default: "inbound")

**Example with Port Range:**
```json
{
  "ip_address": "10.0.0.0",
  "port_start": 80,
  "port_end": 443,
  "protocol": 0,
  "action": 1,
  "direction": "inbound"
}
```

**Example with All Ports:**
```json
{
  "ip_address": "192.168.1.100",
  "port_start": null,
  "port_end": null,
  "protocol": 2,
  "action": 2,
  "direction": "outbound"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "456",
    "ip_address": "192.168.1.100",
    "port_start": 80,
    "port_end": 80,
    "protocol": 0,
    "action": 1,
    "direction": "inbound",
    "userId": "123",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 9. Update Firewall Rule

**Method:** `PUT`  
**URL:** `http://localhost:5000/api/firewall/:id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Body (JSON) - All fields optional:**
```json
{
  "ip_address": "192.168.1.200",
  "port_start": 443,
  "port_end": 443,
  "protocol": 0,
  "action": 2,
  "direction": "outbound"
}
```

**Example URL:**
```
http://localhost:5000/api/firewall/456
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "456",
    "ip_address": "192.168.1.200",
    "port_start": 443,
    "port_end": 443,
    "protocol": 0,
    "action": 2,
    "direction": "outbound",
    "userId": "123",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### 10. Delete Firewall Rule

**Method:** `DELETE`  
**URL:** `http://localhost:5000/api/firewall/:id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Example URL:**
```
http://localhost:5000/api/firewall/456
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Firewall rule deleted successfully"
}
```

---

## Module 3: Automatic Threat Blocker

### 11. Get Threat Blocker Status

**Method:** `GET`  
**URL:** `http://localhost:5000/api/threat-blocker/status`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "lastUpdate": "2024-01-15T00:00:00Z",
    "totalIPs": 10000,
    "blockedToday": 25,
    "blockedThisWeek": 150,
    "sources": ["AbuseIPDB", "Free Sources"],
    "threatTypes": ["Malware C&C", "Botnet", "Brute Force"],
    "updateFrequency": "daily",
    "autoApply": true,
    "notificationsEnabled": true
  }
}
```

---

### 12. Get Blocklist

**Method:** `GET`  
**URL:** `http://localhost:5000/api/threat-blocker/blocklist`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters (Optional):**
- `page=1` - Page number (default: 1)
- `limit=50` - Items per page (default: 50)
- `search=192.168` - Search in IP address
- `threatType=Malware Host` - Filter by threat type
- `source=AbuseIPDB` - Filter by source
- `sortBy=createdAt` - Sort field
- `sortOrder=DESC` - Sort direction (ASC/DESC)

**Example URL with Parameters:**
```
http://localhost:5000/api/threat-blocker/blocklist?page=1&limit=25&threatType=Malware%20Host&search=192.168&sortBy=createdAt&sortOrder=DESC
```

**Valid Threat Types:**
- `Malware C&C`
- `Malware Host`
- `Botnet`
- `Brute Force`
- `Phishing`
- `DDoS`
- `Spam`
- `Exploit`
- `Suspicious`
- `Other`
- `all` (show all)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "blocklist": [
      {
        "id": "1",
        "ipAddress": "192.168.1.100",
        "threatType": "Malware Host",
        "source": "AbuseIPDB",
        "confidence": 95,
        "country": "US",
        "countryName": "United States",
        "lastSeen": "2024-01-15T10:00:00Z",
        "abuseConfidenceScore": 95,
        "totalReports": 150,
        "createdAt": "2024-01-15T00:00:00Z"
      }
      // ... more IPs
    ],
    "pagination": {
      "total": 10000,
      "page": 1,
      "limit": 25,
      "totalPages": 400
    }
  }
}
```

---

### 13. Force Update Blocklist

**Method:** `POST`  
**URL:** `http://localhost:5000/api/threat-blocker/force-update`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Body:** None (empty)

**Expected Response:**
```json
{
  "success": true,
  "message": "Blocklist updated successfully from Free Sources + AbuseIPDB",
  "data": {
    "added": 500,
    "updated": 200,
    "total": 700,
    "updatedAt": "2024-01-15T12:00:00Z",
    "source": "Free Sources + AbuseIPDB"
  }
}
```

---

### 14. Get Threat Blocker Statistics

**Method:** `GET`  
**URL:** `http://localhost:5000/api/threat-blocker/stats`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalIPs": 10000,
    "blockedToday": 25,
    "blockedThisWeek": 150,
    "threatTypeDistribution": [
      { "threatType": "Malware C&C", "count": "3000" },
      { "threatType": "Botnet", "count": "2500" },
      { "threatType": "Brute Force", "count": "2000" }
    ],
    "sourceDistribution": [
      { "source": "AbuseIPDB", "count": "7000" },
      { "source": "Free Sources", "count": "3000" }
    ]
  }
}
```

---

### 15. Update Threat Blocker Settings

**Method:** `PUT`  
**URL:** `http://localhost:5000/api/threat-blocker/settings`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Body (JSON) - All fields optional:**
```json
{
  "enabled": true,
  "updateFrequency": "hourly",
  "autoApply": true,
  "notificationsEnabled": true
}
```

**Valid Update Frequencies:**
- `realtime` - Every minute (for testing)
- `hourly` - Every hour
- `6hours` - Every 6 hours
- `daily` - Every day at midnight

**Expected Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "updateFrequency": "hourly",
    "autoApply": true,
    "enabled": true,
    "notificationsEnabled": true
  }
}
```

---

### 16. Test Threat Blocker

**Method:** `POST`  
**URL:** `http://localhost:5000/api/threat-blocker/test`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Body:** None (empty)

**Expected Response:**
```json
{
  "success": true,
  "message": "Test threat created successfully",
  "data": {
    "threat": {
      "id": "789",
      "threatType": "malware",
      "sourceIp": "192.168.1.100",
      "description": "[TEST] Simulated blocked threat IP: 192.168.1.100 (Malware Host) from AbuseIPDB",
      "severity": "critical",
      "blocked": true,
      "userId": "123"
    },
    "testIP": "192.168.1.100",
    "threatType": "Malware Host"
  }
}
```

---

### 17. Export Blocklist

**Method:** `GET`  
**URL:** `http://localhost:5000/api/threat-blocker/export`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters (Optional):**
- `format=csv` - Export format: `csv` or `json` (default: csv)

**Example URL:**
```
http://localhost:5000/api/threat-blocker/export?format=csv
```

**Expected Response (CSV):**
```
IP Address,Threat Type,Source,Confidence,Country,Last Seen,Total Reports
"192.168.1.100","Malware Host","AbuseIPDB",95,"US","2024-01-15T10:00:00Z",150
...
```

**Expected Response (JSON):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "ipAddress": "192.168.1.100",
      "threatType": "Malware Host",
      "source": "AbuseIPDB",
      "confidence": 95
    }
    // ... more IPs
  ]
}
```

---

## Module 3: Logs and Reporting

### 18. Get Activity Logs

**Method:** `GET`  
**URL:** `http://localhost:5000/api/activity-logs`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters (Optional):**
- `page=1` - Page number (default: 1)
- `limit=50` - Logs per page (default: 50)
- `eventType=Blocked Threat` - Filter by event type
- `severity=critical` - Filter by severity (critical/warning/info)
- `status=Blocked` - Filter by status (Success/Failed/Blocked/Disconnected/Pending)
- `search=192.168` - Search in description or IP address
- `startDate=2024-01-01` - Start date (ISO format)
- `endDate=2024-01-31` - End date (ISO format)
- `userId=123` - Filter by user ID (admin only)
- `userRole=user` - Filter by user role (admin only)
- `sortBy=createdAt` - Sort field
- `sortOrder=DESC` - Sort direction (ASC/DESC)

**Valid Event Types:**
- `VPN Connection`
- `VPN Disconnection`
- `Blocked Threat`
- `System Event`
- `Notification`
- `Firewall Rule Update`
- `Profile Activation`
- `Profile Deactivation`
- `Blocklist Update`
- `User Action`
- `Other`
- `all` (show all)

**Valid Severities:**
- `critical`
- `warning`
- `info`
- `all` (show all)

**Example URL with Parameters:**
```
http://localhost:5000/api/activity-logs?page=1&limit=25&eventType=Blocked%20Threat&status=Blocked&severity=critical&startDate=2024-01-01&endDate=2024-01-31&search=192.168&sortBy=createdAt&sortOrder=DESC
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "1",
        "eventType": "Blocked Threat",
        "description": "Blocked connection from threat IP: 192.168.1.100",
        "status": "Blocked",
        "severity": "critical",
        "ipAddress": "192.168.1.100",
        "createdAt": "2024-01-15T10:00:00Z",
        "user": {
          "id": "123",
          "email": "user@example.com",
          "role": "user"
        },
        "device": {
          "id": "456",
          "deviceName": "Desktop PC",
          "deviceId": "desktop-123"
        },
        "metadata": {
          "threatType": "Malware C&C",
          "source": "AbuseIPDB",
          "confidence": 95
        }
      }
      // ... more logs
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 25,
      "totalPages": 6
    }
  }
}
```

---

### 19. Get Log By ID

**Method:** `GET`  
**URL:** `http://localhost:5000/api/activity-logs/:id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Example URL:**
```
http://localhost:5000/api/activity-logs/1
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "eventType": "Blocked Threat",
    "description": "Blocked connection from threat IP: 192.168.1.100",
    "status": "Blocked",
    "severity": "critical",
    "ipAddress": "192.168.1.100",
    "createdAt": "2024-01-15T10:00:00Z",
    "user": {
      "id": "123",
      "email": "user@example.com"
    },
    "device": {
      "id": "456",
      "deviceName": "Desktop PC"
    }
  }
}
```

---

### 20. Export Activity Logs

**Method:** `GET`  
**URL:** `http://localhost:5000/api/activity-logs/export`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters (Optional):**
- `format=csv` - Export format: `csv` or `json` (default: csv)
- `eventType=Blocked Threat` - Filter by event type
- `severity=critical` - Filter by severity
- `startDate=2024-01-01` - Start date (ISO format)
- `endDate=2024-01-31` - End date (ISO format)

**Example URL:**
```
http://localhost:5000/api/activity-logs/export?format=csv&eventType=Blocked%20Threat&startDate=2024-01-01&endDate=2024-01-31
```

**Expected Response (CSV):**
```
Timestamp,Event Type,Description,IP Address,Status,Severity,User Email
"2024-01-15T10:00:00Z","Blocked Threat","Blocked connection from threat IP: 192.168.1.100","192.168.1.100","Blocked","critical","user@example.com"
...
```

**Expected Response (JSON):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "eventType": "Blocked Threat",
      "description": "Blocked connection from threat IP: 192.168.1.100",
      "status": "Blocked",
      "severity": "critical"
    }
    // ... more logs
  ]
}
```

---

## Quick Reference: All Endpoints Summary

### Admin Panel Endpoints:
1. `GET /api/admin/users` - Get all users
2. `GET /api/admin/users/:id` - Get user by ID
3. `PUT /api/admin/users/:id` - Update user
4. `DELETE /api/admin/users/:id` - Delete user
5. `GET /api/admin/statistics` - Get admin statistics

### Dashboard Endpoints:
6. `GET /api/dashboard` - Get dashboard data

### Firewall Endpoints:
7. `GET /api/firewall` - Get all firewall rules
8. `POST /api/firewall` - Create firewall rule
9. `PUT /api/firewall/:id` - Update firewall rule
10. `DELETE /api/firewall/:id` - Delete firewall rule

### Threat Blocker Endpoints:
11. `GET /api/threat-blocker/status` - Get threat blocker status
12. `GET /api/threat-blocker/blocklist` - Get blocklist
13. `POST /api/threat-blocker/force-update` - Force update blocklist
14. `GET /api/threat-blocker/stats` - Get statistics
15. `PUT /api/threat-blocker/settings` - Update settings
16. `POST /api/threat-blocker/test` - Test threat blocker
17. `GET /api/threat-blocker/export` - Export blocklist

### Logs Endpoints:
18. `GET /api/activity-logs` - Get activity logs
19. `GET /api/activity-logs/:id` - Get log by ID
20. `GET /api/activity-logs/export` - Export logs

---

## Common Error Responses

### 401 Unauthorized (No Token):
```json
{
  "success": false,
  "message": "Not authorized"
}
```

### 403 Forbidden (Not Admin):
```json
{
  "success": false,
  "message": "Access denied: Admins only"
}
```

### 400 Bad Request (Validation Error):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "ip_address is required",
    "protocol must be 0 (TCP), 1 (UDP), or 2 (BOTH)"
  ]
}
```

### 404 Not Found:
```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 Internal Server Error:
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Postman Collection Setup Tips

### 1. Create Environment Variables:
- `base_url`: `http://localhost:5000`
- `token`: (set after login)

### 2. Use Variables in URLs:
```
{{base_url}}/api/admin/users
```

### 3. Set Authorization Header:
- Type: Bearer Token
- Token: `{{token}}`

### 4. Create Pre-request Script (for auto-login):
```javascript
// Auto-login before each request (optional)
pm.sendRequest({
    url: pm.environment.get("base_url") + '/api/auth/login',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            email: 'admin@test.com',
            password: 'your_password'
        })
    }
}, function (err, res) {
    if (!err) {
        const jsonData = res.json();
        pm.environment.set("token", jsonData.token);
    }
});
```

---

## Testing Checklist

### Admin Panel:
- [ ] Get all users (with filters)
- [ ] Get user by ID
- [ ] Update user
- [ ] Delete user
- [ ] Get statistics

### Dashboard:
- [ ] Get dashboard data

### Firewall:
- [ ] Get all rules
- [ ] Create rule (with different protocols/actions)
- [ ] Update rule
- [ ] Delete rule

### Threat Blocker:
- [ ] Get status
- [ ] Get blocklist (with filters)
- [ ] Force update
- [ ] Get statistics
- [ ] Update settings
- [ ] Test threat blocker
- [ ] Export blocklist

### Logs:
- [ ] Get logs (with all filters)
- [ ] Get log by ID
- [ ] Export logs (CSV and JSON)

---

## Important Notes for Exam

1. **Always include Authorization header** with Bearer token
2. **Content-Type header** required for POST/PUT requests
3. **URL encoding** for query parameters with spaces (e.g., "Blocked Threat" → "Blocked%20Threat")
4. **Protocol/Action values** are integers (0, 1, 2), not strings
5. **Date formats** should be ISO format (YYYY-MM-DD or full ISO string)
6. **Pagination** uses `page` and `limit` parameters
7. **Filtering** uses query parameters, not body (for GET requests)
8. **Admin routes** require admin role (check with `admin` middleware)

---

**This guide covers all Postman API calls for Saadat modules! 📮**

