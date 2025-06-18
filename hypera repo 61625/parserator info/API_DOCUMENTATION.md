# 📚 PARSERATOR API DOCUMENTATION

## 🌐 **Base URL**
```
Production: https://app-5108296280.us-central1.run.app
```

## 🔐 **Authentication**

### **Anonymous Access (Limited)**
- **Limit**: 10 requests per day
- **Use Case**: Trials, demos, onboarding
- **No API key required**

### **API Key Authentication**
```bash
# Header method (recommended)
curl -H "X-API-Key: pk_test_your_key_here"

# Bearer token method
curl -H "Authorization: Bearer pk_live_your_key_here"
```

### **API Key Formats**
- **Test Keys**: `pk_test_*` (for development)
- **Live Keys**: `pk_live_*` (for production)

## 📊 **Subscription Tiers**

| Tier | Daily Limit | Monthly Limit | Price | Features |
|------|-------------|---------------|-------|----------|
| Anonymous | 10 | 50 | Free | Trial access |
| Free | 50 | 1,000 | Free | API keys, basic tracking |
| Pro | 1,000 | 20,000 | $29/mo | Higher limits, priority support |
| Enterprise | Unlimited | Unlimited | Custom | SLA, custom features |

## 🔗 **Endpoints**

### **Health & Info**

#### `GET /health`
System health check (no authentication required)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-15T18:55:40.849Z",
  "version": "2.0.0",
  "message": "Parserator API is running!"
}
```

#### `GET /v1/info`
API information and capabilities

**Response:**
```json
{
  "name": "Parserator API",
  "version": "2.0.0",
  "authentication": {
    "methods": ["X-API-Key header", "Authorization Bearer"],
    "keyFormat": "pk_test_* or pk_live_*",
    "anonymous": "Limited trial access available"
  },
  "limits": {
    "anonymous": "10 requests/day",
    "free": "50 requests/day",
    "pro": "1000 requests/day",
    "enterprise": "unlimited"
  }
}
```

### **Core Parsing**

#### `POST /v1/parse`
Main data parsing endpoint

**Headers:**
```
Content-Type: application/json
X-API-Key: pk_test_your_key (optional for anonymous)
```

**Request Body:**
```json
{
  "inputData": "John Smith, Software Engineer at Google, john.smith@gmail.com, +1-555-123-4567",
  "outputSchema": {
    "name": "string",
    "title": "string",
    "company": "string",
    "email": "string",
    "phone": "string"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "parsedData": {
    "name": "John Smith",
    "title": "Software Engineer",
    "company": "Google",
    "email": "john.smith@gmail.com",
    "phone": "+1-555-123-4567"
  },
  "metadata": {
    "architectPlan": {
      "steps": [...],
      "confidence": 0.95,
      "strategy": "field-by-field extraction"
    },
    "confidence": 0.95,
    "tokensUsed": 245,
    "processingTimeMs": 1250,
    "requestId": "req_1749998765432",
    "timestamp": "2025-06-15T18:55:40.849Z",
    "version": "2.0.0",
    "features": ["structured-outputs", "api-key-auth"],
    "userTier": "pro",
    "billing": "api_key_usage",
    "userId": "user_12345"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "inputData and outputSchema are required"
  }
}
```

### **User Management**

#### `POST /v1/user/keys`
Generate new API key (requires Firebase Auth)

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "My Production Key",
  "environment": "live"
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": "pk_live_abc123def456...",
  "name": "My Production Key",
  "environment": "live",
  "created": "2025-06-15T18:55:40.849Z"
}
```

#### `GET /v1/user/keys`
List user's API keys

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "id": "pk_test_abc123...",
      "name": "Development Key",
      "environment": "test",
      "created": "2025-06-15T10:30:00.000Z",
      "prefix": "pk_test_..."
    }
  ],
  "count": 1
}
```

#### `GET /v1/user/usage`
Get usage statistics

**Response:**
```json
{
  "success": true,
  "usage": {
    "today": {
      "requests": 15,
      "tokens": 3750,
      "limit": 1000,
      "remaining": 985
    },
    "thisMonth": {
      "requests": 450,
      "tokens": 112500,
      "limit": 20000,
      "remaining": 19550
    },
    "allTime": {
      "requests": 2340,
      "tokens": 585000
    }
  },
  "tier": "pro",
  "lastRequest": "2025-06-15T18:45:30.123Z"
}
```

#### `DELETE /v1/user/keys/:keyId`
Deactivate an API key

**Response:**
```json
{
  "success": true,
  "message": "API key deactivated successfully"
}
```

## ⚠️ **Error Responses**

### **Authentication Errors**

#### Invalid API Key Format
```json
{
  "error": "Invalid API key format",
  "message": "API key must start with pk_live_ or pk_test_",
  "provided": "invalid_ke...",
  "documentation": "https://docs.parserator.com/authentication"
}
```

#### Invalid API Key
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is not valid or has been deactivated"
}
```

### **Rate Limiting**

#### Usage Limit Exceeded
```json
{
  "error": "Usage limit exceeded",
  "message": "Daily limit of 50 requests exceeded",
  "tier": "free",
  "usage": {
    "daily": { "requests": 50, "tokens": 12500 },
    "monthly": { "requests": 1200, "tokens": 300000 }
  },
  "upgradeUrl": "https://parserator.com/pricing"
}
```

### **Input Validation**

#### Missing Required Fields
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "inputData and outputSchema are required"
  }
}
```

#### Parsing Failed
```json
{
  "success": false,
  "error": {
    "code": "PARSE_FAILED",
    "message": "Unable to extract data with provided schema"
  },
  "metadata": {
    "processingTimeMs": 2100,
    "requestId": "req_1749998765432"
  }
}
```

## 📝 **Schema Types**

### **Supported Output Types**
```json
{
  "stringField": "string",
  "numberField": "number", 
  "booleanField": "boolean",
  "arrayField": "array",
  "dateField": "string",
  "emailField": "string",
  "phoneField": "string"
}
```

### **Common Use Cases**

#### Contact Extraction
```json
{
  "inputData": "John Doe, CEO at TechCorp, john@techcorp.com, (555) 123-4567",
  "outputSchema": {
    "name": "string",
    "title": "string",
    "company": "string", 
    "email": "string",
    "phone": "string"
  }
}
```

#### Invoice Parsing
```json
{
  "inputData": "Invoice #INV-2025-001, Date: 2025-06-15, Amount: $1,234.56, Due: 2025-07-15",
  "outputSchema": {
    "invoiceNumber": "string",
    "date": "string",
    "amount": "number",
    "dueDate": "string",
    "currency": "string"
  }
}
```

#### Product Information
```json
{
  "inputData": "MacBook Pro 16-inch, $2,399, 16GB RAM, 512GB SSD, Rating: 4.8/5",
  "outputSchema": {
    "name": "string",
    "price": "number",
    "specs": "array",
    "rating": "number"
  }
}
```

## 🔧 **SDKs & Integration**

### **Node.js SDK**
```bash
npm install @parserator/sdk-node
```

```javascript
import { Parserator } from '@parserator/sdk-node';

const client = new Parserator('pk_test_your_key_here');

const result = await client.parse({
  inputData: 'John Doe Engineer john@example.com',
  outputSchema: {
    name: 'string',
    title: 'string',
    email: 'string'
  }
});
```

### **Python SDK**
```bash
pip install parserator-python
```

```python
from parserator import ParseClient

client = ParseClient('pk_test_your_key_here')

result = client.parse(
    input_data='Jane Smith Manager jane@company.com',
    output_schema={
        'name': 'string',
        'title': 'string', 
        'email': 'string'
    }
)
```

### **cURL Examples**
```bash
# Anonymous parsing
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "Alice Johnson Developer alice@startup.com",
    "outputSchema": {
      "name": "string",
      "role": "string",
      "email": "string"
    }
  }'

# Authenticated parsing
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pk_test_your_key_here" \
  -d '{
    "inputData": "Bob Wilson CTO bob@enterprise.com +1-555-999-8888",
    "outputSchema": {
      "name": "string",
      "title": "string",
      "email": "string",
      "phone": "string"
    }
  }'
```

## 🚀 **Getting Started**

### **1. Try Anonymous Access**
Start with anonymous access (10 requests/day) to test the API:

```bash
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "Your sample data here",
    "outputSchema": {"field1": "string", "field2": "string"}
  }'
```

### **2. Sign Up for API Key**
1. Visit [parserator.com/signup](https://parserator.com/signup)
2. Sign in with Google or Apple
3. Generate your first API key
4. Start with free tier (50 requests/day)

### **3. Upgrade for Production**
- **Pro Tier**: $29/month for 1000 requests/day
- **Enterprise**: Custom pricing for unlimited usage
- **Contact**: support@parserator.com

## 📞 **Support**

- **Documentation**: https://docs.parserator.com
- **API Status**: https://status.parserator.com  
- **Support Email**: support@parserator.com
- **GitHub Issues**: https://github.com/parserator/issues

## 🔄 **Changelog**

### **v2.0.0 (Latest)**
- ✅ Express architecture with middleware pipeline
- ✅ Real database API key validation
- ✅ Usage tracking and rate limiting
- ✅ User management endpoints
- ✅ Tier-based subscription system

### **v1.0.0**
- ✅ Core parsing with structured outputs
- ✅ Anonymous trial access
- ✅ Basic API key format validation
- ✅ Zero JSON parsing errors