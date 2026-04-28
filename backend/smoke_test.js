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
    console.log('Health ->', await get('http://localhost:5001/health'));
    console.log('Fertilizer ->', await get('http://localhost:5001/api/fertilizer?n=10&p=10&k=10&ph=6'));
    const img = path.join(__dirname, 'uploads', 'sample.png');
    if (fs.existsSync(img)) {
      console.log('Predict-image mock ->', await postMultipart('http://localhost:5001/api/predict-image?mock=1', 'file', img));
    } else {
      console.warn('Sample image not found:', img);
    }
    process.exit(0);
  } catch (e) {
    console.error('Smoke test failure:', e);
    process.exit(2);
  }
})();
