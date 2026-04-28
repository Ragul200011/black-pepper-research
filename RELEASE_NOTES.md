Release notes — Smart Black Pepper Guardian
===========================================

Summary:
- Audit and polish of backend and mobile app.
- Added mock inference mode (`MOCK_PREDICTIONS`) so backend runs without ML models.
- Deferred TensorFlow imports to runtime in Python scripts; recommend using Docker inference image.
- Added CI smoke test workflow and optional Docker Hub publish step.
- Cleaned ESLint/flake8 warnings and migrated a few inline styles to `StyleSheet`.

Running locally (mock mode):

1. Backend (mock):
   Set environment and start:
   ```powershell
   cd backend
   $env:MOCK_PREDICTIONS='1'
   node server.js
   ```

2. Mobile (Expo):
   ```powershell
   cd black-pepper-mobile-main
   npm install
   npm start
   ```

Adding real models:
- Place model files under `backend/models/` (preserve existing filenames expected by `predict_image.py`, `predict_variety.py`).
- Build and run inference Docker image:
  ```bash
  cd backend
  docker build -f Dockerfile.inference -t black-pepper-backend-inference .
  docker run -d --name bp -p 5001:5001 -v $(pwd)/models:/app/models black-pepper-backend-inference
  ```

CI:
- Workflow `.github/workflows/ci-smoke.yml` builds the inference image, runs it in mock mode, and executes smoke tests.
- The workflow can optionally publish the built image to Docker Hub when `DOCKERHUB_USERNAME` and `DOCKERHUB_PASSWORD` are configured in repository secrets.

Next steps:
- Provide real model files to enable full inference testing (I can validate end-to-end in Docker once models are available).
- Optionally, migrate remaining inline styles to `StyleSheet` across screens for full ESLint cleanliness.
