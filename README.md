## License server

HTTP server for the Windows installer: validates license keys and binds each key to **one PC**. The key is only a unique 16-character code; the **PC identity is read from the computer** and saved in the database when a key is first used.

### How it works

- **Key**: Unique 16 alphanumeric characters in the form `XXXX-XXXX-XXXX-XXXX`. The key does **not** contain any PC identity.
- **PC identity**: The installer reads the machine ID from Windows (e.g. MachineGuid) and sends it with the key. The server stores this **only when a key is used for the first time** (no PC linked yet).
- **One key → one PC**: If the same key is used again on the **same** PC (e.g. reinstall), activation succeeds. If the same key is used on a **different** PC, the server responds `ALREADY_USED_ELSEWHERE`.

### API

- **GET** `/activate?key=XXXX-XXXX-XXXX-XXXX&machineId=...`
  - `OK` – Key valid, first activation or same PC.
  - `INVALID_KEY` – Key not in database.
  - `INVALID_KEY_FORMAT` – Key not 16 alphanumeric (xxxx-xxxx-xxxx-xxxx).
  - `ALREADY_USED_ELSEWHERE` – Key already linked to another PC.
  - `ERROR_*` – Server error.

### Setup

1. Install Node.js (v18+) from https://nodejs.org/
2. `cd license-server`
3. `npm install`
4. `npm start` (or double-click `start-license-server.cmd` from the project folder)

### Managing keys

- Keys are stored in `data/licenses.json`. Each entry:  
  `{ "key": "XXXX-XXXX-XXXX-XXXX", "machineId": null, "activatedAt": null }`  
  When a user activates, `machineId` and `activatedAt` are set; the key is then tied to that PC.
- **Generate a new key** (16 alphanumeric, correct format):  
  `npm run generate-key`  
  Then add the printed key to `data/licenses.json` and restart the server if it’s running.
