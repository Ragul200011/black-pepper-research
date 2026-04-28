// backend/server.js  — Final Clean Version
// Berry Analysis (quality grading / curing) route REMOVED
// All fixes applied: Python detection, fertilizer route, auth stubs, env vars
require('dotenv').config();

const express             = require('express');
const axios               = require('axios');
const cors                = require('cors');
const multer              = require('multer');
const fs                  = require('fs');
const { spawn, execSync } = require('child_process');
const path                = require('path');

const app  = express();
const PORT = process.env.PORT || 5001;
const MOCK_PREDICTIONS = (process.env.MOCK_PREDICTIONS === 'true' || process.env.MOCK_PREDICTIONS === '1' || process.env.MOCK === 'true');

// ── Detect Python once at startup ─────────────────────────────────────────────
let PYTHON_CMD = 'python3';
try { execSync('python --version', { stdio:'ignore' }); PYTHON_CMD = 'python'; } catch {}
const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production';
const logger = {
  info: (...args) => { if (DEBUG) console.log(...args); },
  debug: (...args) => { if (DEBUG) console.debug(...args); },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};
logger.info(`🐍 Python: ${PYTHON_CMD}`);

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Config (from .env) ────────────────────────────────────────────────────────
const TS_CHANNEL = process.env.TS_CHANNEL || '3187265';
const TS_KEY     = process.env.TS_KEY     || 'ISFWVJXZW7P5TMQ9';
const OWM_KEY    = process.env.OWM_KEY    || 'bd5e378503939ddaee76f12ad7a97608';

// ── File Upload ───────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive:true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const safe = (file.originalname || 'image.jpg').replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith('image/'))
      return cb(new Error('Only image files are allowed.'));
    cb(null, true);
  },
});

const deleteFile = (p) => p && fs.unlink(p, () => {});

// ── Python helper ─────────────────────────────────────────────────────────────
function runPython(args, callback) {
  const proc = spawn(PYTHON_CMD, args);
  let out = '', err = '';
  proc.stdout.on('data', d => { out += d.toString(); });
  proc.stderr.on('data', d => { err += d.toString(); });
  proc.on('error', e  => callback(null, `spawn error: ${e.message}`));
  proc.on('close', code => {
    if (code !== 0) return callback(null, err || `exit code ${code}`);
    try {
      const lines  = out.trim().split('\n');
      const parsed = JSON.parse(lines[lines.length - 1].trim());
      if (parsed.error) return callback(null, parsed.error);
      callback(parsed, null);
    } catch (e) {
      callback(null, `JSON parse failed: ${out.slice(0, 120)}`);
    }
  });
}

// ── Root / Health ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('🌱 Smart Black Pepper Guardian Backend Running'));

app.get('/health', (req, res) => res.json({
  status:  'ok',
  python:  PYTHON_CMD,
  routes: [
    'GET  /api/soil-analysis',
    'GET  /api/weather',
    'GET  /api/fertilizer',
    'POST /api/predict-image',
    'POST /api/variety-predict',
    'POST /api/auth/signin',
    'POST /api/auth/register',
  ],
}));

// ── Auth (stubs — replace with real DB + JWT) ─────────────────────────────────
app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });
  return res.json({
    success: true,
    user: { id:'001', name: email.split('@')[0], email },
    token: 'dev-token',
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  return res.json({
    success: true,
    user: { id: Date.now().toString(), name, email },
    token: 'dev-token',
  });
});

// ── Soil Analysis ─────────────────────────────────────────────────────────────
app.get('/api/soil-analysis', async (req, res) => {
  try {
    const url = `https://api.thingspeak.com/channels/${TS_CHANNEL}/feeds.json?api_key=${TS_KEY}&results=1`;
    const response = await axios.get(url, { timeout:10000 });
    const feeds = response.data.feeds;
    if (!feeds?.length) return res.status(404).json({ error: 'No data on ThingSpeak channel.' });

    const f = feeds[0];
    const sensorData = {
      Moisture:    parseFloat(f.field1 || 0),
      Temperature: parseFloat(f.field2 || 0),
      pH:          parseFloat(f.field4 || 0),
      Nitrogen:    parseFloat(f.field5 || 0),
      Phosphorus:  parseFloat(f.field6 || 0),
      Potassium:   parseFloat(f.field7 || 0),
      Humidity:    0,
    };

    function ruleBasedAnalysis(s) {
      const issues = [];
      if (s.pH < 5.0 || s.pH > 7.5)               issues.push(`pH ${s.pH} outside 5.0–7.5`);
      if (s.Nitrogen < 30)                          issues.push(`Low N (${s.Nitrogen} mg/kg)`);
      if (s.Phosphorus < 10)                        issues.push(`Low P (${s.Phosphorus} mg/kg)`);
      if (s.Potassium < 50)                         issues.push(`Low K (${s.Potassium} mg/kg)`);
      if (s.Moisture < 30 || s.Moisture > 85)       issues.push(`Moisture ${s.Moisture}% out of range`);
      if (s.Temperature < 18 || s.Temperature > 38) issues.push(`Temp ${s.Temperature}°C out of range`);
      const healthy = issues.length === 0;
      return {
        prediction: healthy ? 'Healthy' : 'Needs Attention',
        status:     healthy ? 'Healthy' : 'Needs Attention',
        consensus:  healthy ? 'Healthy Soil' : 'Soil Needs Attention',
        issues,  rule_based: true,
        note: healthy ? 'All parameters within optimal range' : issues.join('; '),
      };
    }

    runPython([path.join(__dirname, 'predict.py'), JSON.stringify(sensorData)], (result, err) => {
      if (err) console.warn('Python ML failed — using rule-based:', err);
      const ai = result ?? ruleBasedAnalysis(sensorData);
      return res.json({ timestamp: f.created_at, sensors: sensorData, ai_analysis: ai });
    });

  } catch (error) {
    console.error('Soil analysis error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch from ThingSpeak.' });
  }
});

// ── Weather ───────────────────────────────────────────────────────────────────
app.get('/api/weather', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 6.9147;
    const lon = parseFloat(req.query.lon) || 79.9729;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`;
    const r = await axios.get(url, { timeout:8000 });
    const d = r.data;
    return res.json({
      city:        d.name,
      temperature: d.main.temp,
      feels_like:  d.main.feels_like,
      humidity:    d.main.humidity,
      wind:        d.wind.speed,
      weather:     d.weather[0]?.description ?? '',
      icon:        d.weather[0]?.icon ?? '',
    });
  } catch (e) {
    console.error('Weather error:', e.message);
    return res.status(500).json({ error: 'Could not fetch weather data.' });
  }
});

// ── Fertilizer ────────────────────────────────────────────────────────────────
app.get('/api/fertilizer', (req, res) => {
  const n = parseFloat(req.query.n) || 0;
  const p = parseFloat(req.query.p) || 0;
  const k = parseFloat(req.query.k) || 0;
  const ph = parseFloat(req.query.ph) || 7;

  function score(id) {
    let s = 0;
    if (id===1){ s=20; if(n<20)s+=55; else if(n<40)s+=40; else if(n<60)s+=15; else if(n<80)s+=2; else s-=25; if(ph>=5.5&&ph<=7)s+=15; }
    else if(id===2){ s=25; if(n>=20&&n<=70&&p>=10&&p<=35&&k>=30&&k<=100)s+=40; if(ph>=5.5&&ph<=7)s+=20; }
    else if(id===3){ s=18; if(p<10)s+=58; else if(p<20)s+=42; else if(p<30)s+=20; else if(p<40)s+=5; else s-=15; if(ph>=5.5&&ph<=6.5)s+=14; }
    else if(id===4){ s=18; if(k<30)s+=58; else if(k<60)s+=42; else if(k<90)s+=20; else if(k<120)s+=5; else s-=15; if(ph>=5.5&&ph<=7)s+=14; }
    else if(id===5){ s=15; if(ph<4.5)s+=65; else if(ph<5)s+=55; else if(ph<5.5)s+=40; else if(ph<6)s+=15; else if(ph>7)s-=25; }
    else if(id===6){ s=50; if(n<30||p<15||k<40)s+=15; if(ph<5.5||ph>7.5)s+=10; }
    else if(id===7){ s=15; if(p<15)s+=38; if(n>=15&&n<=50)s+=18; if(k>=20&&k<=80)s+=15; if(ph>=5.5&&ph<=6.8)s+=14; }
    return Math.max(0, Math.min(100, s));
  }

  const all_ranked = [1,2,3,4,5,6,7]
    .map(id => ({ id, score: score(id) }))
    .sort((a,b) => b.score - a.score);

  return res.json({ all_ranked, source:'server' });
});

// ── Disease Image Prediction ───────────────────────────────────────────────────
app.post('/api/predict-image',
  (req, res, next) => { logger.debug('Image upload received'); next(); },
  upload.single('file'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image. Use field name 'file'." });
    const imgPath = req.file.path;
    // Mock mode: return a deterministic demo response without invoking Python
    // Allow per-request mock override: ?mock=1
    const perRequestMock = req.query && (req.query.mock === '1' || req.query.mock === 'true');
    if (MOCK_PREDICTIONS || perRequestMock) {
      deleteFile(imgPath);
      const mock = {
        rejected: false,
        low_confidence: false,
        reject_reason: null,
        prediction: 'Healthy',
        confidence: 98.5,
        raw_detector_score: 99.0,
        pepper_score: 99.0,
        all_probabilities: { Healthy: 98.5, 'Leaf Blight': 1.0, 'Slow Wilt': 0.5 },
        model_name: 'mock-effnet',
        description: 'Mock prediction (MOCK_PREDICTIONS enabled).',
        advice: 'Provide model files in backend/models for real predictions.',
      };
      return res.json({ success: true, image_name: req.file.filename, ai_analysis: mock });
    }

    runPython([path.join(__dirname, 'predict_image.py'), imgPath], (result, err) => {
      deleteFile(imgPath);
      if (err) return res.status(500).json({ error: 'Image prediction failed', details: err });
      return res.json({ success:true, image_name: req.file.filename, ai_analysis: result });
    });
  }
);

// ── Variety Prediction ────────────────────────────────────────────────────────
app.post('/api/variety-predict', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
  const imgPath = req.file.path;
  const perRequestMock = req.query && (req.query.mock === '1' || req.query.mock === 'true');
  if (MOCK_PREDICTIONS || perRequestMock) {
    deleteFile(imgPath);
    const mock = {
      accepted: true,
      stageA: { label: 'pepper_leaf', confidence: 99.9 },
      prediction: { label: 'Butawerala', confidence: 95.0 },
      probabilities: { Butawerala: 95.0, Dingirala: 3.0, Kohukuburerala: 2.0 },
      message: 'ok',
    };
    return res.json(mock);
  }

  runPython([path.join(__dirname, 'predict_variety.py'), imgPath], (result, err) => {
    deleteFile(imgPath);
    if (err) return res.status(500).json({ error: 'Variety prediction failed', details: err });
    return res.json(result);
  });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError)
    return res.status(400).json({ error: 'Upload error', details: err.message });
  if (err) return res.status(400).json({ error: err.message });
  next();
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`\n🌱 Smart Black Pepper Guardian  →  http://localhost:${PORT}`);
  logger.info(`Routes: soil-analysis · weather · fertilizer · predict-image · variety-predict · auth\n`);
});