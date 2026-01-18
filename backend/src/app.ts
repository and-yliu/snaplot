import express from 'express';
import type { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import cors from 'cors';
import { setupSocketHandlers } from './socket.handlers.js';

// ============================================================================
// Express & Socket.io Setup
// ============================================================================

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// Multer Configuration for Photo Uploads
// ============================================================================

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and HEIC allowed.'));
    }
  },
});

// ============================================================================
// Routes
// ============================================================================

app.get('/', (_req: Request, res: Response) => {
  res.send('IRL Quests Backend - Ready!');
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Photo upload endpoint
app.post('/upload', upload.single('photo'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const photoPath = path.join('uploads', req.file.filename);

  res.json({
    success: true,
    photoId: req.file.filename,
    path: photoPath,
  });
});

// Error handler for multer
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: err.message });
  } else if (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// Socket.io Handlers
// ============================================================================

setupSocketHandlers(io);

// ============================================================================
// Start Server
// ============================================================================

httpServer.listen(port, () => {
  console.log(`🎮 IRL Quests server running on http://localhost:${port}/`);
  console.log(`📡 Socket.io ready for connections`);
});