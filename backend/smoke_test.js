const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

function get(url) {
  return new Promise((res, rej) => {
    http
      .get(url, (r) => {
        let body = '';
        r.on('data', (c) => (body += c));
        r.on('end', () => res({ status: r.statusCode, body }));
      })
      .on('error', rej);
  });
}

function postMultipart(url, field, filePath) {
  return new Promise((res, rej) => {
    const form = new FormData();
    form.append(field, fs.createReadStream(filePath));
    form.submit(url, (err, r) => {
      if (err) return rej(err);
      let body = '';
      r.on('data', (c) => (body += c));
      r.on('end', () => res({ status: r.statusCode, body }));
    });
  });
}

(async () => {
  try {
    const img = path.join(__dirname, 'uploads', 'sample.png');
    if (fs.existsSync(img)) {
      // Print concise smoke results
      const h = await get('http://localhost:5001/health');
      const f = await get('http://localhost:5001/api/fertilizer?n=10&p=10&k=10&ph=6');
      const p = await postMultipart('http://localhost:5001/api/predict-image?mock=1', 'file', img);
      console.log('SMOKE health status:', h.status);
      console.log('SMOKE fertilizer status:', f.status);
      console.log('SMOKE predict status:', p.status);
    } else {
      console.warn('Sample image not found:', img);
    }
    process.exit(0);
  } catch (e) {
    console.error('Smoke test failure:', e);
    process.exit(2);
  }
})();
