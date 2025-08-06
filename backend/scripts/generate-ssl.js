#!/usr/bin/env node

/**
 * Generate Self-Signed SSL Certificates for Development
 * This script creates self-signed certificates for local HTTPS development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SSL_DIR = path.join(__dirname, '..', 'ssl');
const CERT_PATH = path.join(SSL_DIR, 'cert.pem');
const KEY_PATH = path.join(SSL_DIR, 'key.pem');

console.log('🔐 Generating self-signed SSL certificates for development...');

// Create SSL directory if it doesn't exist
if (!fs.existsSync(SSL_DIR)) {
  fs.mkdirSync(SSL_DIR, { recursive: true });
  console.log('📁 Created SSL directory');
}

// Check if certificates already exist
if (fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH)) {
  console.log('⚠️  SSL certificates already exist. Use --force to regenerate.');
  console.log(`   Certificate: ${CERT_PATH}`);
  console.log(`   Private Key: ${KEY_PATH}`);
  process.exit(0);
}

try {
  // Generate self-signed certificate using OpenSSL
  const opensslCommand = `openssl req -x509 -newkey rsa:4096 -keyout "${KEY_PATH}" -out "${CERT_PATH}" -days 365 -nodes -subj "/C=US/ST=Development/L=Local/O=AgriSphere/OU=Development/CN=localhost"`;
  
  console.log('🔧 Running OpenSSL command...');
  execSync(opensslCommand, { stdio: 'inherit' });
  
  console.log('✅ SSL certificates generated successfully!');
  console.log(`   Certificate: ${CERT_PATH}`);
  console.log(`   Private Key: ${KEY_PATH}`);
  console.log('');
  console.log('📝 To enable HTTPS:');
  console.log('   1. Set SSL_ENABLED=true in your .env file');
  console.log('   2. Restart the server');
  console.log('   3. Access your API at https://localhost:5001');
  console.log('');
  console.log('⚠️  Note: Self-signed certificates will show browser warnings.');
  console.log('   This is normal for development. Use proper certificates in production.');
  
} catch (error) {
  console.error('❌ Failed to generate SSL certificates:', error.message);
  console.log('');
  console.log('💡 Make sure OpenSSL is installed on your system:');
  console.log('   - macOS: brew install openssl');
  console.log('   - Ubuntu/Debian: sudo apt-get install openssl');
  console.log('   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
  process.exit(1);
} 