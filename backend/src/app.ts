import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import sharp from 'sharp';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const heicConvert = require('heic-convert');
import { setupSocketHandlers } from './socket.handlers.js';

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

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(path.resolve('uploads')));

// Use memory storage - process buffer directly without intermediate disk write
const upload = multer({
  storage: multer.memoryStorage(),
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

app.get('/', (_req: Request, res: Response) => {
  res.send('IRL Quests Backend - Ready!');
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Photo upload endpoint - auto-converts all images to JPG
app.post('/upload', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const originalExt = path.extname(req.file.originalname).toLowerCase();
    const jpgFilename = `${uuidv4()}.jpg`;
    const jpgPath = path.join('uploads', jpgFilename);
    const isHeic = originalExt === '.heic' || originalExt === '.heif';

    if (isHeic) {
      // HEIC: convert directly to JPEG and save (no Sharp needed)
      const jpgBuffer = await heicConvert({
        buffer: req.file.buffer,
        format: 'JPEG',
        quality: 0.6,
      });
      fs.writeFileSync(jpgPath, Buffer.from(jpgBuffer));
    } else {
      // Other formats: compress with Sharp
      await sharp(req.file.buffer)
        .jpeg({ quality: 60 })
        .toFile(jpgPath);
    }

    res.json({
      success: true,
      photoId: jpgFilename,
      photoPath: jpgPath.replaceAll('\\', '/'),
      photoUrl: `/uploads/${jpgFilename}`,
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Error handler for multer
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: err.message });
  } else if (err) {
    res.status(400).json({ error: err.message });
  }
});

setupSocketHandlers(io);

httpServer.listen(port, () => {
  console.log(`🎮 IRL Quests server running on http://localhost:${port}/`);
  console.log(`📡 Socket.io ready for connections`);
});
