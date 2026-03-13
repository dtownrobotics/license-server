# Add License Server Code to GitHub (dtownrobotics/license-server)

Your repo currently only has **licenses.json**. Render needs **package.json**, **src/**, and **scripts/** to build. Add them using one of the two methods below.

---

## Method 1: Push from your PC (fastest if you have Git)

In **Command Prompt** or **PowerShell** run these (one block at a time):

```cmd
cd C:\Users\Asus\Documents\PhoenixBuilder\license-server
git init
git remote add origin https://github.com/dtownrobotics/license-server.git
git pull origin main --allow-unrelated-histories
```

Then add everything except node_modules and push:

```cmd
echo node_modules/> .gitignore
echo data/>> .gitignore
git add package.json package-lock.json src scripts .gitignore
git add licenses.json
git status
git commit -m "Add license server code for Render"
git push -u origin main
```

(If the repo already has files and it asks for merge message, just save and exit. If `git pull` fails, try `git pull origin main --allow-unrelated-histories`.)

---

## Method 2: Add each file on GitHub (no Git needed)

Go to **https://github.com/dtownrobotics/license-server**. Add these 4 files.

### Step 1: Add package.json at root

1. Click **Add file** → **Create new file**.
2. In the name box type: **package.json**
3. Paste this content, then click **Commit changes**:

```json
{
  "name": "license-server",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "generate-key": "node scripts/generate-key.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "mongodb": "^6.10.0",
    "morgan": "^1.10.0"
  }
}
```

### Step 2: Add src/index.js

1. Click **Add file** → **Create new file**.
2. In the name box type: **src/index.js** (this creates the `src` folder).
3. Paste the content from the file **license-server/src/index.js** on your PC (full content).
4. Click **Commit changes**.

### Step 3: Add src/licenses.js

1. Click **Add file** → **Create new file**.
2. Name: **src/licenses.js**
3. Paste the content from **license-server/src/licenses.js** on your PC (full content).
4. Click **Commit changes**.

### Step 4: Add scripts/generate-key.js

1. Click **Add file** → **Create new file**.
2. Name: **scripts/generate-key.js**
3. Paste the content from **license-server/scripts/generate-key.js** on your PC (full content).
4. Click **Commit changes**.

---

When done, the repo root should show: **package.json**, **licenses.json**, **src/** (with index.js, licenses.js), **scripts/** (with generate-key.js). Then on Render click **Manual Deploy** → **Deploy latest commit**.
