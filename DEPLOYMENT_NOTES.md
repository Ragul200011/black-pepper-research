Deployment notes — backend (Docker) and local demo

Backend Docker (quick demo, mock predictions enabled):

1. Build and run with docker-compose (uses mock predictions by default):

```bash
docker compose up --build
```

This builds the `backend` image from `backend/Dockerfile` and starts the service on port `5001`.
The compose file sets `MOCK_PREDICTIONS=true` so the predict endpoints return demo responses without TensorFlow/model binaries.

2. To run real inference in Docker you must supply model files and a Python environment. Recommended approach:
- Create a separate Python image with TensorFlow preinstalled (or mount a host venv), and run a thin API that calls Python scripts or a WSGI app.
- Mount `backend/models/` into the container at runtime and ensure GPU/CUDA compatibility if using GPU builds.

4. Inference-ready Docker (CPU example)

The repo includes `backend/Dockerfile.inference` and `docker-compose.inference.yml` which build an image containing both Python (pip) and Node.js so the Node server can spawn Python inference scripts directly.

Usage (build + run with models mounted):

```bash
docker compose -f docker-compose.inference.yml up --build
```

Notes:
- Place your model files under `backend/models/` before starting the container (they will be mounted into the container).
- Use `MOCK_PREDICTIONS=true` to force mock mode for demo; set it to `false` for real inference.
- For GPU acceleration, use a TensorFlow GPU base image on a compatible host and update `requirements.txt` accordingly.

3. Local demo guide (no Docker):
- Start backend (mock enabled for local testing):

```powershell
cd backend
# optionally: set MOCK_PREDICTIONS=1 in env
node server.js
```

- Start the Expo app (mobile):

```powershell
cd black-pepper-mobile-main
npm install
npm start
```

Notes
- The Docker image bundles only the Node server; it does not include Python or ML models.
- For full production inference, build a reproducible Python image (many TensorFlow images are large) and orchestrate with docker-compose.
