# HTTPS Setup Guide for AgriSphere Backend

This guide explains how to enable HTTPS support for the AgriSphere backend API.

## 🚀 Quick Start (Development)

### 1. Generate Self-Signed Certificates

```bash
# Generate SSL certificates for development
npm run ssl:generate
```

### 2. Enable HTTPS in Development

```bash
# Start server with HTTPS enabled
npm run ssl:dev
```

Or manually:

```bash
# Set environment variable and start
SSL_ENABLED=true npm run dev
```

### 3. Access HTTPS API

- **HTTP**: http://localhost:5000
- **HTTPS**: https://localhost:5001

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# HTTPS Configuration
SSL_ENABLED=true
SSL_PORT=5001
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem
SSL_CA_PATH=./ssl/ca.pem
HTTP_REDIRECT=false
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `SSL_ENABLED` | `false` | Enable HTTPS server |
| `SSL_PORT` | `5001` | HTTPS server port |
| `SSL_CERT_PATH` | `./ssl/cert.pem` | Path to SSL certificate |
| `SSL_KEY_PATH` | `./ssl/key.pem` | Path to SSL private key |
| `SSL_CA_PATH` | `undefined` | Path to CA certificate (optional) |
| `HTTP_REDIRECT` | `false` | Redirect HTTP to HTTPS |

## 🏭 Production Setup

### 1. Obtain SSL Certificates

For production, use proper SSL certificates from a trusted CA:

- **Let's Encrypt** (free): https://letsencrypt.org/
- **Cloudflare**: https://cloudflare.com/
- **Your hosting provider**

### 2. Configure Certificates

Place your certificates in the `ssl/` directory:

```
backend/
├── ssl/
│   ├── cert.pem      # Your SSL certificate
│   ├── key.pem       # Your private key
│   └── ca.pem        # CA certificate (if needed)
```

### 3. Update Environment

```env
SSL_ENABLED=true
SSL_PORT=443
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem
SSL_CA_PATH=./ssl/ca.pem
HTTP_REDIRECT=true
```

### 4. Security Headers

The server automatically includes security headers when HTTPS is enabled:

- HSTS (HTTP Strict Transport Security)
- Secure cookie flags
- Content Security Policy

## 🔍 Testing HTTPS

### Test with curl

```bash
# Test HTTP
curl http://localhost:5000/api

# Test HTTPS (ignore certificate warnings in development)
curl -k https://localhost:5001/api
```

### Test with Frontend

Update your frontend API configuration to use HTTPS:

```javascript
// In frontend/src/services/api.js
const API_BASE_URL = 'https://localhost:5001/api';
```

## 🛡️ Security Considerations

### Development

- Self-signed certificates will show browser warnings
- Use `-k` flag with curl to ignore certificate warnings
- Only use for local development

### Production

- Always use certificates from trusted CAs
- Enable HTTP to HTTPS redirects
- Set appropriate security headers
- Regularly renew certificates

## 🔧 Troubleshooting

### Certificate Issues

```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Verify certificate and key match
openssl x509 -noout -modulus -in ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in ssl/key.pem | openssl md5
```

### Port Issues

```bash
# Check if ports are in use
lsof -i :5000
lsof -i :5001

# Kill processes using ports
kill -9 $(lsof -t -i:5001)
```

### OpenSSL Installation

**macOS:**
```bash
brew install openssl
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install openssl
```

**Windows:**
Download from https://slproweb.com/products/Win32OpenSSL.html

## 📚 Additional Resources

- [Node.js HTTPS Documentation](https://nodejs.org/api/https.html)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practices-security.html)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [SSL/TLS Configuration Guide](https://ssl-config.mozilla.org/)

## 🆘 Support

If you encounter issues:

1. Check the server logs for SSL-related errors
2. Verify certificate file permissions
3. Ensure OpenSSL is properly installed
4. Test with curl to isolate frontend/backend issues 