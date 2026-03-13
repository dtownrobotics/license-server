# Deploy License Server on Hostinger

Use this guide to run the license server on your Hostinger server so the installer can activate keys over the internet.

---

## 1. What you need on Hostinger

- **VPS or Cloud** (recommended): Full SSH access, you install Node.js and run the app.
- **Shared hosting**: Only works if your plan has **Node.js** in the control panel (some Hostinger plans do). If you don’t see “Node.js” in hPanel, use a VPS.

Below: **Option A** for VPS/Cloud, **Option B** for shared with Node.js.

---

## 2. Option A: Hostinger VPS or Cloud (SSH)

### 2.1 Connect to the server

- In Hostinger: **VPS** or **Cloud** → your server → **SSH access** (user + IP or hostname).
- Connect with SSH (PowerShell, CMD, or PuTTY):
  ```bash
  ssh root@your-server-ip
  ```
  (Replace with your actual user and IP.)

### 2.2 Install Node.js (if not installed)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Check
node -v
npm -v
```

### 2.3 Upload the license-server

**Option 1 – From your PC (PowerShell):**

```powershell
cd C:\Users\Asus\Documents\YourProjectFolder
scp -r license-server root@your-server-ip:/root/
```

**Option 2 – Using Hostinger File Manager or FTP:**  
Zip the `license-server` folder (no need to zip `node_modules`), upload the zip, then on the server:

```bash
cd /root
unzip license-server.zip
# or extract and rename so the folder is named "license-server"
```

**Option 3 – Git (if you use it):**  
Clone your repo on the server and use the `license-server` folder from there.

The goal is to have on the server something like:

```
/root/license-server/
  package.json
  src/
    index.js
    licenses.js
  scripts/
    generate-key.js
  data/          (created on first run)
    licenses.json
```

### 2.4 Install dependencies and run

```bash
cd /root/license-server
npm install --production
```

Create or edit `data/licenses.json` and add your keys (see “Managing keys” below). Then test run:

```bash
PORT=3000 node src/index.js
```

You should see: `License server listening on http://127.0.0.1:3000`.  
Stop it with `Ctrl+C` when done testing.

### 2.5 Run permanently (PM2)

```bash
sudo npm install -g pm2
cd /root/license-server
PORT=3000 pm2 start src/index.js --name license-server
pm2 save
pm2 startup
```

The server will keep running after reboot. Check:

```bash
pm2 status
pm2 logs license-server
```

### 2.6 Open port 3000 in firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 3000
sudo ufw reload
```

In Hostinger firewall / security panel, allow **inbound TCP port 3000** (or the port you use).

### 2.7 (Optional) Use port 80 with Nginx

If you want the installer to use `http://yourdomain.com` (port 80) instead of `http://yourdomain.com:3000`:

1. Install Nginx:
   ```bash
   sudo apt install nginx
   ```
2. Create a site config:
   ```bash
   sudo nano /etc/nginx/sites-available/license-server
   ```
   Paste (replace `yourdomain.com`):

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
3. Enable and reload:
   ```bash
   sudo ln -s /etc/nginx/sites-available/license-server /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
4. Point your domain’s DNS (in Hostinger) to this server’s IP.

Then in the installer use **ServerHost = 'yourdomain.com'** and **ServerPort = 80** (see section 4 below).

---

## 3. Option B: Hostinger Shared hosting with Node.js

If your plan has “Node.js” in hPanel:

1. In **hPanel** → **Node.js** → create a new application.
2. Set **Application root** to a folder, e.g. `license-server`.
3. Upload (via File Manager or FTP) only these into that folder:
   - `package.json`
   - `src/` (with `index.js`, `licenses.js`)
   - `scripts/` (with `generate-key.js`)
   - Do **not** upload `node_modules` (Hostinger will run `npm install`).
4. Set **Application startup file** to `src/index.js` (or as required by the panel).
5. Set **Port** to the one shown (e.g. 3000) or leave default.
6. Create `data/licenses.json` in that folder (see “Managing keys”).
7. Start the application and note the URL (e.g. `https://yourdomain.com:port` or the URL Hostinger gives you).

Use that URL in the installer (host + port) as in section 4.

---

## 4. Point the installer to your server

After the server is running and reachable at e.g. `http://yourdomain.com:3000` or `http://yourdomain.com` (port 80):

1. Open **installer\MyAppInstaller.iss** in a text editor.
2. Find:
   ```pascal
   const
     ServerHost = '127.0.0.1';
     ServerPort = 3000;
   ```
3. Change to your real host and port, for example:
   ```pascal
   const
     ServerHost = 'yourdomain.com';   // or your server IP
     ServerPort = 80;                 // or 3000 if you didn’t use Nginx
   ```
4. Rebuild the installer (Inno Setup → Build → Compile).

Users will then activate against `http://ServerHost:ServerPort` (e.g. `http://yourdomain.com:3000` or `http://yourdomain.com`).

---

## 5. Managing keys on the server

- **Add keys:** Edit `license-server/data/licenses.json` on the server. Each entry:
  ```json
  { "key": "XXXX-XXXX-XXXX-XXXX", "machineId": null, "activatedAt": null }
  ```
- **Generate a key:** On your PC in the project:
  ```bash
  cd license-server
  npm run generate-key
  ```
  Add the printed key to `data/licenses.json` on the server (and restart the app if it was running).
- **Restart after editing:**  
  - PM2: `pm2 restart license-server`  
  - Shared Node.js: use the panel’s “Restart” for the app.

---

## 6. Quick checklist

- [ ] Node.js installed (VPS) or Node.js app created (shared).
- [ ] `license-server` files uploaded; `npm install` run (VPS) or done by panel (shared).
- [ ] `data/licenses.json` exists with at least one key.
- [ ] App running (PM2 on VPS or “Running” in panel on shared).
- [ ] Port (3000 or 80) open in firewall and/or Nginx configured.
- [ ] Installer rebuilt with your **ServerHost** and **ServerPort**.
- [ ] Test: open `http://your-server:port` in a browser and see “License server running”; run the installer and activate with a key.

---

## 7. HTTPS (optional but recommended later)

For production you can put Nginx in front and use **SSL** (e.g. Let’s Encrypt on Hostinger). Then the installer would need to call `https://yourdomain.com` instead of `http`. The current installer uses plain HTTP; changing it to HTTPS would require code changes. For a first deployment, HTTP is enough to get the server live; you can add HTTPS and update the installer afterward.
