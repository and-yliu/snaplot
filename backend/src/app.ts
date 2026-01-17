import express from 'express';
import type { Request, Response } from 'express'; 

const app: express.Application = express();
const port: number = 3000;

app.get('/', (_req: Request, res: Response) => {
  res.send('TypeScript With Express!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/`);
});