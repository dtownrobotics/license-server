# Deploy License Server FREE (No paid server)

Use **Render + MongoDB Atlas** (both free). Your installer will activate keys over the internet and keys are stored permanently in the cloud.

---

## Recommended: Render + MongoDB Atlas (free, persistent)

This works reliably and keeps your keys even when the app restarts.

### Part 1: MongoDB Atlas (free database)

1. **Sign up**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → **Try Free**.
   - Create an account (email or Google).

2. **Create a free cluster**
   - Choose **M0 FREE** (Shared).
   - Pick a region close to you (or leave default).
   - Click **Create**.

3. **Allow access**
   - **Database Access** → **Add New Database User** → choose password, note it → **Create User**.
   - **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0) → **Confirm**.
     (Render’s IPs change, so this is needed for free tier.)

4. **Get connection string**
   - **Database** → **Connect** → **Drivers** (or “Connect your application”).
   - Copy the connection string. It looks like:
     ```text
     mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `USERNAME` and `PASSWORD` with your DB user and password (if not already there).
   - Add a database name in the path (e.g. before `?` add `/licensedb`):
     ```text
     mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/licensedb?retryWrites=true&w=majority
     ```
   - Save this as your **MONGODB_URI** (you’ll paste it into Render).

### Part 2: Put code on GitHub

1. Create a new repo on GitHub (e.g. `license-server`).
2. On your PC, in your project folder, the `license-server` folder already has everything.
3. Upload (or push) these into the repo **at the root** of the repo:
   - `package.json`
   - `src/index.js`
   - `src/licenses.js`
   - `scripts/generate-key.js`
   - Do **not** upload `node_modules` or `data/` (Render will use MongoDB instead).

So the repo root should contain at least: `package.json`, folder `src/`, folder `scripts/`.

### Part 3: Deploy on Render

1. Go to [render.com](https://render.com) and sign up (free, with GitHub).

2. **New Web Service**
   - **New +** → **Web Service**.
   - Connect your GitHub account if asked, then select the repo you used for the license server.
   - **Name:** e.g. `license-server`.
   - **Region:** pick one near you.
   - **Root Directory:** leave blank (repo root has `package.json`).
   - **Runtime:** Node.
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` or `node src/index.js`
   - **Instance Type:** Free.

3. **Environment variables**
   - **Environment** tab (or “Advanced” before Create) → **Add Environment Variable**.
   - **Key:** `MONGODB_URI`
   - **Value:** paste your full MongoDB connection string (from Part 1).
   - Add another:
     - **Key:** `PORT`
     - **Value:** `3000`
   - (Render may set PORT automatically; if not, 3000 is fine.)

4. Click **Create Web Service**. Wait for the first deploy to finish (a few minutes).

5. **Your URL** will be like: **`https://license-server-xxxx.onrender.com`** (see the top of the service page).

6. **Test**
   - Open that URL in a browser → you should see **License server running**.
   - Test activation:
     ```text
     https://license-server-xxxx.onrender.com/activate?key=A1B2-C3D4-E5F6-G7H8&machineId=test123
     ```
     You should get **OK** (the server seeds two default keys if the DB is empty).

### Part 4: Point the installer to Render

1. On your PC, open **installer\MyAppInstaller.iss** in a text editor.
2. Find:
   ```pascal
   const
     UseHTTPS = False;
     ServerHost = '127.0.0.1';
     ServerPort = 3000;
   ```
3. Change to (use your real Render URL **without** `https://`):
   ```pascal
   const
     UseHTTPS = True;
     ServerHost = 'license-server-xxxx.onrender.com';
     ServerPort = 443;
   ```
4. Save and **rebuild the installer** (Inno Setup → Compile).

Done. The installer will now activate against your free Render + MongoDB server. Keys are stored in MongoDB and persist across restarts.

---

## Adding more license keys (MongoDB)

- **From your PC:** run `npm run generate-key` in the `license-server` folder, then add the key in Atlas:
  - MongoDB Atlas → **Database** → **Browse Collections** → open database `licensedb` → collection `licenses` → **Insert Document**.
  - Example document:
    ```json
    {
      "key": "XXXX-XXXX-XXXX-XXXX",
      "keyNorm": "XXXXXXXXXXXXXXXX",
      "machineId": null,
      "activatedAt": null
    }
    ```
  - `keyNorm` = the 16 characters without dashes, uppercase (e.g. for `A1B2-C3D4-E5F6-G7H8` use `A1B2C3D4E5F6G7H8`).
- Or use the two default keys: `A1B2-C3D4-E5F6-G7H8` and `X9Y8-Z7W6-V5U4-T3S2` until you add more.

---

## If Glitch didn’t work (troubleshooting)

- **“Application failed to start”:** Make sure `package.json` has `"start": "node src/index.js"` and that the **src** folder exists with **index.js** and **licenses.js**.
- **Blank page or 503:** Open **Tools** → **Terminal**, run `npm install`, then refresh the app. Check the **Logs** (Tools → Logs) for errors.
- **“Cannot find module”:** All files must be in the right place: `src/index.js`, `src/licenses.js`, and a **data** folder with **licenses.json** (create it manually if the app didn’t create it).
- **CORS or installer can’t connect:** Glitch URLs are HTTPS. In the installer you must set **UseHTTPS = True** and **ServerPort = 443**.

If you prefer to avoid Glitch, use **Render + MongoDB Atlas** above; it’s more reliable for the installer.

---

## Other free options

| Option   | Notes |
|----------|--------|
| **Railway** | [railway.app](https://railway.app) – Free $5/month credit. Deploy from GitHub. Add a **Volume** for the `data` folder if you use the file-based server (no MongoDB). Then set **UseHTTPS = True**, **ServerHost = 'your-app.up.railway.app'**, **ServerPort = 443**. |
| **Glitch**  | [glitch.com](https://glitch.com) – No GitHub needed; paste code and run. Use **UseHTTPS = True**, **ServerHost = 'your-project.glitch.me'**, **ServerPort = 443**. App may sleep after inactivity. |

Always **rebuild the installer** after changing **ServerHost** / **ServerPort** / **UseHTTPS** so the new `.exe` uses your chosen server.
