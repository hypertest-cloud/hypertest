import express, { Request, Response } from 'express';

const PORT = 3006;

export const spawnServer = () => {
  const app = express();
  let index = 0

  app.get('/', (req: Request, res: Response) => {
    console.log('[get] Server index: ', index)
    res.status(200).send(`${index}`)
  });

  app.post('/bump', (req: Request, res: Response) => {
    index += 1
    console.log('[bump] Server index: ', index)
    res.status(200).send(`${index}`)
  });

  app.listen(PORT, () => {
    console.log(`Server started at port: ${PORT}`);
  });

  return app
}
