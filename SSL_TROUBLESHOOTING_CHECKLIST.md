# SSL Error 525 - Quick Troubleshooting Checklist

## One-Command Quick Fix Attempt

```bash
# Run this on your production server to diagnose and fix most issues:
echo "=== Checking SSL Configuration ===" && \
sudo nginx -t && echo "✓ nginx config OK" || echo "✗ nginx config invalid - check /etc/nginx/nginx.conf" && \
echo "" && \
echo "=== Checking Certificate ===" && \
sudo openssl x509 -noout -dates -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem && echo "✓ Certificate valid" || echo "✗ Certificate missing or invalid" && \
echo "" && \
echo "=== Checking Services ===" && \
sudo systemctl is-active nginx && echo "✓ nginx running" || echo "✗ nginx not running" && \
sudo systemctl is-active doczen && echo "✓ Node.js running" || echo "✗ Node.js not running" && \
echo "" && \
echo "=== Reloading Services ===" && \
sudo systemctl reload nginx && echo "✓ nginx reloaded" && \
pm2 restart doczen && echo "✓ Node.js restarted" && \
echo "" && \
echo "=== Testing HTTPS ===" && \
openssl s_client -connect doczen.co.in:443 -servername doczen.co.in < /dev/null 2>&1 | grep -E "(Verify return code|CN=)" && echo "✓ SSL handshake successful" || echo "✗ SSL handshake failed"
```

---

## Step-by-Step Diagnostic

### Problem: Error 525 appears in browser

**✅ Step 1: Check Certificate Exists**
```bash
ls -la /etc/letsencrypt/live/doczen.co.in/
# Expected: fullchain.pem, privkey.pem should exist
```
- ❌ **Missing?** Run: `sudo certbot certonly -d doczen.co.in -d www.doczen.co.in`
- ✅ **Found?** → Go to Step 2

---

**✅ Step 2: Check Certificate Valid**
```bash
sudo openssl x509 -noout -text -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem | grep -A 2 "Subject:"
sudo openssl x509 -noout -dates -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem
```
- ❌ **Expired?** Run: `sudo certbot renew --force-renewal`
- ❌ **Wrong domain?** Reissue certificate for correct domains
- ✅ **Valid?** → Go to Step 3

---

**✅ Step 3: Check nginx Configuration**
```bash
sudo nginx -t
```
- ❌ **Fails?** Check /etc/nginx/nginx.conf for syntax errors
  - Look for: `ssl_certificate` path pointing to fullchain.pem
  - Look for: `listen 443 ssl http2;`
  - Look for: `server_name doczen.co.in www.doczen.co.in;`
- ✅ **OK?** → Go to Step 4

---

**✅ Step 4: Reload nginx**
```bash
sudo systemctl reload nginx
# Or if that fails:
sudo systemctl restart nginx
```

Check status:
```bash
sudo systemctl status nginx
```
- ❌ **Failed?** Check error log: `sudo tail -50 /var/log/nginx/error.log`
- ✅ **Running?** → Go to Step 5

---

**✅ Step 5: Check Cloudflare Settings**

In Cloudflare Dashboard:
1. **SSL/TLS > Overview**: Should be **"Full (Strict)"** ← CRITICAL
2. **SSL/TLS > Always Use HTTPS**: Should be **ON**
3. **DNS**: Verify A record points to your origin IP
   - ❌ **Wrong IP?** Update the A record
   - ✅ **Correct?** → Go to Step 6

---

**✅ Step 6: Test Direct HTTPS**
```bash
# Replace YOUR_ORIGIN_IP with your server IP
curl -I https://YOUR_ORIGIN_IP/api/health -H "Host: doczen.co.in"
```
- ❌ **Connection refused?** 
  - Port 443 might be blocked by firewall
  - Run: `sudo ufw allow 443/tcp` (if using ufw)
- ❌ **SSL error?** 
  - Certificate mismatch or invalid
  - Re-run: `sudo certbot certonly --force-renewal`
- ✅ **200 OK?** → Go to Step 7

---

**✅ Step 7: Test via Cloudflare**
```bash
# After 5 minutes for DNS propagation
curl -I https://www.doczen.co.in/api/health
```
- ❌ **Still 525?** 
  - Clear Cloudflare cache: Dashboard > Caching > Purge Everything
  - Wait 5 minutes and retry
- ✅ **200 OK?** → **FIXED!** ✓

---

## Common Issues & Quick Fixes

### Issue: "Certificate not found"
```bash
# Solution:
sudo certbot certonly --standalone -d doczen.co.in -d www.doczen.co.in
# Or:
sudo certbot certonly --webroot -w /var/www/doczen/client/build -d doczen.co.in -d www.doczen.co.in
```

### Issue: "Connection refused on port 443"
```bash
# Solution 1: Check if nginx is listening
sudo netstat -tlnp | grep 443

# Solution 2: Check firewall
sudo ufw allow 443/tcp
sudo ufw reload

# Solution 3: Reload nginx
sudo systemctl reload nginx
```

### Issue: "Handshake failed" / "Unknown certificate"
```bash
# Solution 1: Verify certificate matches domain
openssl s_client -connect doczen.co.in:443 -servername doczen.co.in < /dev/null | grep CN=

# Solution 2: Force certificate renewal
sudo certbot certonly --force-renewal -d doczen.co.in -d www.doczen.co.in

# Solution 3: Reload nginx after renewal
sudo systemctl reload nginx
```

### Issue: "Cloudflare still shows error after fixes"
```bash
# Solution 1: Clear cache
# In Cloudflare Dashboard: Caching > Purge Everything

# Solution 2: Check Cloudflare SSL mode
# Should be "Full (Strict)", not "Flexible" or "Full"

# Solution 3: Check DNS propagation
nslookup www.doczen.co.in 1.1.1.1

# Solution 4: Wait 5-10 minutes for DNS/cache to clear
```

### Issue: "Error connecting to backend"
```bash
# Solution: Restart Node.js server
pm2 restart doczen
# Or:
sudo systemctl restart doczen

# Check if it's running:
pm2 status doczen
# Or:
sudo systemctl status doczen
```

---

## Automatic Renewal Setup

Ensure automatic certificate renewal works:

```bash
# Check renewal timer
sudo systemctl list-timers | grep certbot

# If not running, enable it:
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal (dry-run):
sudo certbot renew --dry-run

# Check renewal log:
sudo tail -50 /var/log/letsencrypt/letsencrypt.log
```

---

## Logs to Check (in order)

**1. nginx error log** (SSL issues usually here):
```bash
sudo tail -100 /var/log/nginx/error.log | grep -i ssl
```

**2. nginx access log** (connection attempts):
```bash
sudo tail -20 /var/log/nginx/access.log | grep 443
```

**3. Node.js app log** (if using systemd):
```bash
sudo journalctl -u doczen -n 50 --no-pager
```

**4. SSL renewal log** (certificate issues):
```bash
sudo tail -50 /var/log/letsencrypt/letsencrypt.log
```

**5. System log** (firewall/port issues):
```bash
sudo journalctl -xe | tail -30
```

---

## Testing Tools

### Test 1: SSL Certificate Chain
```bash
openssl s_client -connect doczen.co.in:443 -showcerts -servername doczen.co.in < /dev/null
# Look for: 
# - "Verify return code: 0 (ok)"
# - 3 certificates in the chain
# - Certificate CN matches your domain
```

### Test 2: HTTPS Response
```bash
curl -v https://www.doczen.co.in/api/health
# Look for:
# - "HTTP/2 200" or "HTTP/1.1 200"
# - No SSL errors
```

### Test 3: Cloudflare Headers
```bash
curl -I https://www.doczen.co.in/ | grep -E "(CF-Ray|cf-cache|cache-control)"
# Should show Cloudflare headers if proxied correctly
```

### Test 4: DNS Resolution
```bash
# From various locations
nslookup www.doczen.co.in 8.8.8.8          # Google DNS
dig www.doczen.co.in @1.1.1.1              # Cloudflare DNS
host www.doczen.co.in 208.67.222.222       # OpenDNS
```

---

## If All Else Fails

**Temporary Workaround** (less secure, use for testing):
1. In Cloudflare Dashboard: SSL/TLS → Set to "Flexible"
2. Test if website works
3. If yes: Your certificate has an issue → Renew it
4. If no: Your Node.js server has an issue → Check app logs

**Escalation Steps:**
1. Verify origin IP in Cloudflare matches actual server IP
2. Contact hosting provider to check port 443 is open
3. Check if there's a WAF rule blocking HTTPS
4. Verify firewall isn't blocking connection (run `sudo iptables -L | grep 443`)

---

## Prevention Checklist

To prevent 525 errors in future:

- [ ] Set up auto-renewal for certificate: `sudo systemctl enable certbot.timer`
- [ ] Monitor certificate expiration: Add calendar reminder 30 days before expiration
- [ ] Test renewal monthly: `sudo certbot renew --dry-run`
- [ ] Keep nginx updated: `sudo apt update && sudo apt upgrade`
- [ ] Monitor logs weekly: `sudo tail -100 /var/log/nginx/error.log`
- [ ] Test HTTPS monthly: `curl -I https://www.doczen.co.in`
- [ ] Keep Cloudflare SSL mode as "Full (Strict)"
- [ ] Enable HSTS in Cloudflare SSL/TLS settings
- [ ] Set up monitoring/alerts for certificate expiration

---

## One-Liner Fixes

```bash
# Quickest fix attempt (run all at once):
sudo certbot renew && sudo nginx -t && sudo systemctl reload nginx && pm2 restart doczen && echo "=== All reloaded ===" && curl -I https://www.doczen.co.in/api/health
```

---

## Still Not Working?

1. Take screenshot of error and logs
2. Collect information:
   ```bash
   echo "Certificate:" && sudo openssl x509 -noout -dates -in /etc/letsencrypt/live/doczen.co.in/fullchain.pem && \
   echo "nginx test:" && sudo nginx -t && \
   echo "Direct HTTPS test:" && openssl s_client -connect doczen.co.in:443 -servername doczen.co.in < /dev/null 2>&1 | grep "Verify return code"
   ```
3. Provide output to support or cloud provider support
