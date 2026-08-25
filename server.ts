import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // In-memory user simulation for the example
  const users = [
    { id: 1, username: 'admin', password: 'password' }
  ];

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Set a simple auth cookie
      res.cookie('auth_token', 'simulated_jwt_token', { httpOnly: true });
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true });
  });

  app.get('/api/me', (req, res) => {
    const token = req.cookies?.auth_token;
    if (token === 'simulated_jwt_token') {
      res.json({ authenticated: true, user: { id: 1, username: 'admin' } });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Settings API endpoint
  let systemSettings = {
    theme: 'dark',
    notifications: true,
    dataStorageAllowed: false,
    architecture: 16,
    isAdmin: false
  };

  // Settings API endpoint
  app.get('/api/settings', (req, res) => {
    const token = req.cookies?.auth_token;
    if (token === 'simulated_jwt_token') {
      res.json(systemSettings);
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

  // Save Settings
  app.post('/api/settings', (req, res) => {
    const token = req.cookies?.auth_token;
    if (token === 'simulated_jwt_token') {
      systemSettings = req.body;
      res.json({ success: true, settings: systemSettings });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
