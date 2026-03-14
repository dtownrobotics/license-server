import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getLicenseByKey, activateLicense, initDb, isValidKeyFormat } from './licenses.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/', (req, res) => {
  res.send('License server running');
});

// Activation: key = unique 16 alphanumeric (xxxx-xxxx-xxxx-xxxx). PC identity (machineId) is sent by installer and stored on first use; one key → one PC.
app.get('/activate', async (req, res) => {
  const key = (req.query.key || '').trim();
  const machineId = (req.query.machineId || '').trim();

  if (!key || !machineId) {
    return res.status(400).send('ERROR_MISSING_PARAMS');
  }
  if (!isValidKeyFormat(key)) {
    return res.send('INVALID_KEY_FORMAT');
  }

  try {
    const existing = await getLicenseByKey(key);
    if (!existing) {
      return res.send('INVALID_KEY');
    }

    if (!existing.machineId) {
      await activateLicense(key, machineId);
      return res.send('OK');
    }

    if (existing.machineId === machineId) {
      return res.send('OK');
    }

    return res.send('ALREADY_USED_ELSEWHERE');
  } catch (err) {
    console.error('Activation error:', err);
    return res.status(500).send('ERROR_SERVER');
  }
});

initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log(`License server listening on http://127.0.0.1:${PORT}`);
      console.log('Test in browser: http://127.0.0.1:' + PORT);
      console.log('Keep this window open while running the installer.');
      console.log('');
    });
  })
  .catch((err) => {
    console.error('Failed to initialize license DB:', err);
    process.exit(1);
  });

