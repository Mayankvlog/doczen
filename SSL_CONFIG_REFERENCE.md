# SSL Configuration Reference - Critical Settings

## TL;DR - Minimum Required Actions

1. **Get SSL Certificate:**
   ```bash
   sudo certbot certonly -d doczen.co.in -d www.doczen.co.in
   ```

2. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

3. **Set Cloudflare SSL to "Full (Strict)"**

4. **Test:**
   ```bash
   curl -I https://www.doczen.co.in
   ```

---

## nginx.conf - Key Sections Explained

### HTTP → HTTPS Redirect
```nginx
# This block redirects all HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name doczen.co.in www.doczen.co.in;
    return 301 https://$server_name$request_uri;  # ← Redirects here
}
```

### HTTPS Server Block
```nginx
server {
    # Listen on HTTPS ports
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name doczen.co.in www.doczen.co.in;

    # ⚠️ CRITICAL: SSL Certificate Paths
    ssl_certificate /etc/letsencrypt/live/doczen.co.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/doczen.co.in/privkey.pem;

    # Security: Only modern TLS versions
    ssl_protocols TLSv1.2 TLSv1.3;

    # Performance: HSTS forces HTTPS client-side
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Performance: Enables HTTP/2
    # (Already in listen directive above)
}
```

### Required Folder Permissions
```bash
# nginx needs to read the certificate files
sudo ls -la /etc/letsencrypt/live/doczen.co.in/
# Expected: fullchain.pem (world readable), privkey.pem (nginx readable)

# If permissions wrong:
sudo chmod 644 /etc/letsencrypt/live/doczen.co.in/fullchain.pem
sudo chmod 644 /etc/letsencrypt/live/doczen.co.in/privkey.pem
```

---

## server.js - Key Sections Explained

### CORS Configuration (HTTPS Only)
```javascript
const corsOptions = {
  origin: [
    'https://doczen.co.in',        // ← HTTPS only
    'https://www.doczen.co.in',    // ← HTTPS only
    'https://doczen.co.in:443',
    'https://www.doczen.co.in:443'
  ],
  credentials: true,
  // ... other options
};
app.use(cors(corsOptions));
```

**Why HTTPS only?** If you allow HTTP, Cloudflare can't proxy the connection properly.

### Trust Cloudflare Proxy
```javascript
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal', '127.0.0.1', '::1', 
  '103.21.244.0/22,103.22.200.0/22,...']);  // ← Cloudflare IP ranges
```

**Why?** Ensures `req.protocol` reflects the original HTTPS request, not the local HTTP connection.

### Enforce HTTPS (Production)
```javascript
app.use((req, res, next) => {
  // Only allow HTTPS in production
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && 
      process.env.NODE_ENV === 'production') {
    return res.status(426).json({ error: 'HTTPS required' });
  }
  next();
});
```

### Auto-Load SSL Certificates
```javascript
const certPath = '/etc/letsencrypt/live/doczen.co.in/fullchain.pem';
const keyPath = '/etc/letsencrypt/live/doczen.co.in/privkey.pem';

if (fs.existsSync(certPath) && fs.existsSync(keyPath) && 
    process.env.NODE_ENV === 'production') {
  // ← Create HTTPS server
  const httpsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    secureOptions: require('constants').SSL_OP_NO_TLSv1 | 
                   require('constants').SSL_OP_NO_TLSv1_1
  };
  https.createServer(httpsOptions, app).listen(PORT, HOST);
} else {
  // ← Fallback to HTTP (development)
  app.listen(PORT, HOST);
}
```

---

## Environment Variables (.env)

```bash
# REQUIRED FOR SSL
NODE_ENV=production

# API port (backend listens on this, nginx proxies port 443 → 5000)
PORT=5000

# CORS origins
FRONTEND_URL=https://doczen.co.in,https://www.doczen.co.in

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/doczen

# Optional: Cloudflare IPs (for advanced trust proxy)
CLOUDFLARE_IPS=103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,104.16.0.0/12,...
```

---

## Cloudflare Dashboard Settings

### SSL/TLS Overview
- **SSL Encryption Mode**: Full (Strict) ← CRITICAL!
  - "Full" = allows untrusted certs (WRONG)
  - "Full (Strict)" = requires valid cert (CORRECT)

### SSL/TLS Edge Certificates
- **Status**: Active
- **Auto Renew**: Enabled (automatic)

### SSL/TLS Custom Nameservers
- **Status**: Set to your nameserver (if applicable)

### SSL/TLS CA Certificate
- Leave as default (Cloudflare-issued)

---

## Certificate File Structure

```bash
/etc/letsencrypt/live/doczen.co.in/
├── fullchain.pem        ← Use THIS in nginx.conf (fullchain includes intermediate)
├── privkey.pem          ← Use THIS in nginx.conf (private key)
├── chain.pem            ← Do not use directly
├── cert.pem             ← Do not use directly
└── README.md            ← Info about renewal
```

### Why fullchain.pem?
- Contains: server cert + intermediate + root cert
- nginx needs the complete chain for SSL stapling to work
- Ensures SSL verification succeeds on all browsers

### Certificate Renewal Paths
```bash
# These are symlinks to /etc/letsencrypt/archive/
# Never manually edit the archive directory!
# certbot manages renewals automatically
```

---

## DNS Configuration (Cloudflare)

### Required DNS Records
```
Type: A
Name: @
Content: YOUR_SERVER_IP  ← Your origin server IP
Proxy: Proxied          ← Orange cloud (Cloudflare enabled)
TTL: Auto

Type: A
Name: www
Content: YOUR_SERVER_IP ← Same IP
Proxy: Proxied          ← Orange cloud
TTL: Auto
```

### CNAME Alternative (if using subdomain)
```
Type: CNAME
Name: api
Content: doczen.co.in
Proxy: Proxied
TTL: Auto
```

---

## Firewall / Port Configuration

### Required Open Ports
```bash
# On your firewall:
- Port 80/TCP (HTTP) - for Let's Encrypt validation and redirect
- Port 443/TCP (HTTPS) - for actual HTTPS traffic

# Check if open (from local machine):
nc -zv YOUR_SERVER_IP 80
nc -zv YOUR_SERVER_IP 443

# Or from server itself:
sudo netstat -tlnp | grep LISTEN
# Should show:
# LISTEN 0.0.0.0:80     (nginx)
# LISTEN 0.0.0.0:443    (nginx)
# LISTEN 0.0.0.0:5000   (node.js)
```

---

## Testing Commands Reference

### 1. Check Certificate Valid
```bash
openssl x509 -noout -text -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem
# Look for:
# - Subject: CN=doczen.co.in (or CN=*.doczen.co.in)
# - Not Before/Not After: Current and future dates
# - Public-Key: 2048 bit or higher
```

### 2. Check Certificate Expiration
```bash
openssl x509 -noout -dates -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem
# Example output:
# notBefore=Jan 15 12:34:56 2024 GMT
# notAfter=Apr 15 12:34:56 2024 GMT
```

### 3. Test SSL Handshake
```bash
openssl s_client -connect doczen.co.in:443 -servername doczen.co.in < /dev/null
# Look for:
# - Verify return code: 0 (ok)
# - Subject: CN=doczen.co.in
# - Issuer: CN=Let's Encrypt
```

### 4. Test Full Certificate Chain
```bash
openssl s_client -connect doczen.co.in:443 -showcerts -servername doczen.co.in < /dev/null | grep "Issuer:"
# Should show 3 issuers (server, intermediate, root)
```

### 5. HTTP → HTTPS Redirect Test
```bash
curl -I http://www.doczen.co.in
# Expected: HTTP/1.1 301 Moved Permanently
# Location: https://www.doczen.co.in
```

### 6. HTTPS Connection Test
```bash
curl -I https://www.doczen.co.in/api/health
# Expected: HTTP/2 200 OK (or HTTP/1.1 200)
```

### 7. Check TLS Version
```bash
openssl s_client -connect doczen.co.in:443 -tls1_2 -servername doczen.co.in < /dev/null | grep "Protocol"
# Should show: TLSv1.2 or TLSv1.3
```

---

## Common Configuration Errors

### Error: "No certificate found"
```bash
# Check file exists:
sudo ls -la /etc/letsencrypt/live/doczen.co.in/fullchain.pem

# If missing, create certificate:
sudo certbot certonly -d doczen.co.in -d www.doczen.co.in
```

### Error: "nginx: [emerg] cannot load certificate"
```bash
# Usually permission issue:
sudo usermod -a -G ssl-cert www-data  # Add nginx user to cert group
sudo systemctl reload nginx

# Or fix permissions:
sudo chmod 644 /etc/letsencrypt/live/doczen.co.in/fullchain.pem
sudo chmod 644 /etc/letsencrypt/live/doczen.co.in/privkey.pem
```

### Error: "SSL_ERROR_BAD_CERT_DOMAIN" in browser
```bash
# Certificate doesn't match domain:
openssl x509 -noout -subject -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem

# Force renewal with correct domains:
sudo certbot certonly --force-renewal -d doczen.co.in -d www.doczen.co.in
sudo systemctl reload nginx
```

### Error: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"
```bash
# Cipher mismatch - check supported ciphers:
openssl s_client -connect doczen.co.in:443 -servername doczen.co.in < /dev/null | grep "Cipher:"

# Verify nginx has correct ciphers in config:
sudo grep "ssl_ciphers" /etc/nginx/nginx.conf
```

---

## Performance Tuning

### Enable HTTP/2 (in nginx.conf)
```nginx
listen 443 ssl http2;  # ← Already in updated config
```
**Benefit**: Multiplexing improves connection efficiency

### Enable OCSP Stapling (in nginx.conf)
```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4;
```
**Benefit**: Faster SSL connection setup

### Enable Session Resumption (in nginx.conf)
```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;
```
**Benefit**: Reuses SSL sessions for repeat connections

### Enable SSL on Node.js Backend (optional)
```javascript
// In Node.js, if not proxied by nginx:
const https = require('https');
https.createServer(options, app).listen(5000);
```

---

## Monitoring & Alerts

### Certificate Expiration Alert
```bash
# Add to crontab to check 30 days before expiration:
0 9 * * * openssl x509 -checkend 2592000 -noout -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem || \
  echo "Certificate expiring in 30 days!" | mail -s "SSL Alert" admin@doczen.co.in
```

### Auto-Renewal Status
```bash
# Check if certbot renewal timer is active:
sudo systemctl is-active certbot.timer

# Check renewal log:
sudo tail -20 /var/log/letsencrypt/letsencrypt.log
```

### Daily SSL Status Check
```bash
#!/bin/bash
# Add to cron: 0 8 * * * /path/to/check_ssl.sh

CERT_FILE="/etc/letsencrypt/live/doczen.co.in/fullchain.pem"

# Check cert expiration
expiration=$(openssl x509 -noout -dates -in "$CERT_FILE" | grep "notAfter=" | cut -d= -f2)
echo "Certificate expires: $expiration"

# Check cert validity
openssl s_client -connect doczen.co.in:443 -servername doczen.co.in < /dev/null 2>&1 | \
  grep "Verify return code"

# Check nginx status
systemctl is-active nginx

# Check Node.js status
pm2 status doczen
```

---

## Backup & Recovery

### Backup SSL Configuration
```bash
# Backup certificates
sudo tar czf /home/user/doczen_certs_backup.tar.gz /etc/letsencrypt/

# Backup nginx config
sudo cp /etc/nginx/nginx.conf /home/user/nginx_backup.conf

# Backup node config
cp server/server.js server/server.js.backup
```

### Restore from Backup
```bash
# Restore certificates
sudo tar xzf /home/user/doczen_certs_backup.tar.gz -C /

# Restore nginx config
sudo cp /home/user/nginx_backup.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx

# Verify
sudo certbot certificates
```

---

## Debugging Mode

Enable verbose logging:

```bash
# nginx debug
sudo nginx -c /etc/nginx/nginx.conf -g "daemon off;" 2>&1 | head -20

# Certbot debug
sudo certbot certonly --debug-challenges -d doczen.co.in

# OpenSSL debug
openssl s_client -connect doczen.co.in:443 -servername doczen.co.in -debug -showcerts < /dev/null
```
