# SSL Handshake Error 525 - Deployment Guide

## Problem
Cloudflare Error 525: SSL Handshake Failure - Cloudflare cannot establish SSL connection to your origin server.

## What Was Fixed

### ✅ nginx.conf
- Added HTTP server on port 80 that redirects to HTTPS
- Added HTTPS server on port 443 with SSL configuration
- Configured SSL certificate paths for Let's Encrypt
- Added HTTP/2 support
- Added HSTS header and security headers
- Fixed cipher suites for better compatibility

### ✅ server.js
- Added HTTPS module and certificate auto-loading
- Updated CORS to accept HTTPS origins only
- Added Cloudflare proxy trust configuration
- Added security middleware to enforce HTTPS
- Improved logging to show SSL status
- Graceful fallback to HTTP if certificates missing

---

## Deployment Steps

### Step 1: Install SSL Certificate

**Option A: Using Let's Encrypt (Recommended)**
```bash
# SSH into your production server
ssh user@your-server-ip

# Install certbot if not already installed
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --standalone -d doczen.co.in -d www.doczen.co.in

# Or if using nginx already:
sudo certbot certonly --webroot -w /var/www/doczen/client/build \
  -d doczen.co.in -d www.doczen.co.in
```

**Option B: If using CloudPanel or similar hosting**
- Navigate to SSL section in your control panel
- Select "Let's Encrypt" and issue certificate for both domains
- Let the panel handle renewal automatically

### Step 2: Verify Certificate Installation

```bash
# Check certificate location
ls -la /etc/letsencrypt/live/doczen.co.in/
# Should show: fullchain.pem, privkey.pem, cert.pem, chain.pem

# Test certificate validity
openssl x509 -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem -text -noout
```

### Step 3: Update Environment Variables

Edit `.env` file in your project root:
```bash
# Add or update these lines
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://doczen.co.in,https://www.doczen.co.in
```

On your production server's `.env` (if different):
```bash
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
FRONTEND_URL=https://doczen.co.in,https://www.doczen.co.in
```

### Step 4: Test nginx Configuration

```bash
# Test nginx config syntax
sudo nginx -t

# Expected output: "syntax is ok" and "test is successful"
```

### Step 5: Reload nginx

```bash
# Reload nginx without stopping the server
sudo systemctl reload nginx

# Or restart if preferred
sudo systemctl restart nginx
```

### Step 6: Restart Node.js Server

```bash
# If using systemd
sudo systemctl restart doczen

# Or if using PM2
pm2 restart doczen

# Or if running manually
# Kill existing process and restart
npm start
```

### Step 7: Verify SSL Works Locally

```bash
# From your local machine or test server
# Test HTTPS connection
curl -I https://www.doczen.co.in
# Should return: HTTP/2 200 or HTTP/1.1 200

# Detailed SSL test
openssl s_client -connect www.doczen.co.in:443 -servername www.doczen.co.in
# Look for: "Verify return code: 0 (ok)"
```

---

## Cloudflare Configuration

### In Cloudflare Dashboard:

1. **DNS Tab**
   - Ensure A record points to your origin server IP
   - Type: A | Name: @ | Content: YOUR_SERVER_IP | Proxy: Proxied
   - Type: A | Name: www | Content: YOUR_SERVER_IP | Proxy: Proxied

2. **SSL/TLS Tab**
   - Overview: Set to **"Full (Strict)"** (CRITICAL for error 525)
   - Always Use HTTPS: **ON**
   - Minimum TLS Version: **1.2**
   - HSTS: **Enable** (max-age: 31536000)
   - Opportunistic Encryption: **ON**

3. **Page Rules (if needed)**
   - Edge Cache TTL: 1 hour (adjust as needed)
   - Cache Level: Cache Everything (for static assets)

4. **Edge Certificates**
   - Should be "Active" automatically
   - Renewal: Automatic

---

## Troubleshooting

### Check 1: Verify SSL Certificate Valid
```bash
# Connect to origin directly (bypass Cloudflare)
openssl s_client -connect YOUR_ORIGIN_IP:443 -servername doczen.co.in

# Look for:
# - "Verify return code: 0 (ok)"
# - Certificate CN matches your domain
# - Certificate not expired
```

### Check 2: Verify nginx Proxy Headers
```bash
# Test that X-Forwarded-Proto is set correctly
curl -I -H "X-Forwarded-Proto: https" https://www.doczen.co.in/api/health
```

### Check 3: Check Logs
```bash
# nginx errors
sudo tail -f /var/log/nginx/error.log

# Node.js application (if running as service)
sudo journalctl -u doczen -f

# SSL certificate renewal log
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Check 4: Verify Cloudflare Can Reach Origin
```bash
# Temporarily disable Cloudflare on one subdomain to test direct access
# In Cloudflare DNS: Set one A record to DNS only (not proxied)
# Then test directly

curl -I https://your-origin-ip/api/health
```

### Check 5: Confirm Certificate Chain
```bash
# Check certificate chain is complete
openssl s_client -connect doczen.co.in:443 -servername doczen.co.in < /dev/null | grep -E "^depth"
```

---

## Common Issues & Solutions

### Error 525 Still Appears
1. ❌ Cloudflare not using "Full (Strict)" SSL mode
   - ✅ Change to "Full (Strict)" in SSL/TLS settings

2. ❌ Certificate not installed or path wrong
   - ✅ Run: `ls /etc/letsencrypt/live/doczen.co.in/`
   - ✅ Check certificate paths in nginx.conf

3. ❌ nginx not reloaded after config change
   - ✅ Run: `sudo systemctl reload nginx`

4. ❌ Wrong origin IP in Cloudflare DNS
   - ✅ Verify with: `nslookup doczen.co.in 1.1.1.1`

5. ❌ Certificate expired
   - ✅ Run: `openssl x509 -enddate -noout -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem`

### Renewal Issues
```bash
# Manual certificate renewal (if auto-renewal fails)
sudo certbot renew --force-renewal

# Test renewal in dry-run mode
sudo certbot renew --dry-run

# Check renewal log
sudo tail -50 /var/log/letsencrypt/letsencrypt.log
```

### Enable Auto-Renewal
```bash
# Check if renewal timer is active
sudo systemctl list-timers | grep certbot

# Enable certbot renewal timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Testing Checklist

Run these before contacting support:

- [ ] SSL certificate exists: `ls /etc/letsencrypt/live/doczen.co.in/`
- [ ] Certificate not expired: `sudo openssl x509 -noout -dates -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem`
- [ ] nginx config valid: `sudo nginx -t`
- [ ] nginx running: `sudo systemctl status nginx`
- [ ] Node.js server running: `sudo systemctl status doczen` (or `pm2 status`)
- [ ] Direct HTTPS works: `curl -I https://YOUR_ORIGIN_IP/api/health`
- [ ] Cloudflare DNS correct: `nslookup www.doczen.co.in 1.1.1.1`
- [ ] Cloudflare SSL = "Full (Strict)": Check dashboard
- [ ] Cloudflare Always Use HTTPS = ON: Check dashboard
- [ ] Website loads without error in browser

---

## Quick Fix Summary

If error 525 appears:

1. **SSH to server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Verify cert exists:**
   ```bash
   ls /etc/letsencrypt/live/doczen.co.in/fullchain.pem
   ```

3. **Reload nginx:**
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. **Check Cloudflare SSL:**
   - Dashboard → SSL/TLS → Overview → Set to "Full (Strict)"

5. **Test:**
   ```bash
   openssl s_client -connect doczen.co.in:443 -servername doczen.co.in
   ```

---

## Support Information

**Error 525 Specific Resources:**
- Cloudflare: https://community.cloudflare.com/t/error-525/
- Let's Encrypt Renewal: https://certbot.eff.org/instructions

**If issue persists after following all steps:**
1. Check Cloudflare status page for incidents
2. Contact your hosting provider to verify:
   - Firewall allows port 443 outbound
   - nginx and Node.js can access /etc/letsencrypt/
3. Temporary workaround: Set Cloudflare SSL to "Flexible" to test (less secure)

---

## Monitoring

Set up monitoring for certificate renewal:
```bash
# Add to crontab to alert if cert expires in 30 days
0 0 * * * certbot renew --quiet && echo "Cert renewed" || echo "Cert renewal needed - $(date)" | mail -s "Doczen SSL Alert" admin@doczen.co.in
```

Or use Cloudflare's email notifications in SSL/TLS settings.
