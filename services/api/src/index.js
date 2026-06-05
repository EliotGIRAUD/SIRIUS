import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';
import { startCronJobs } from './services/cronService.js';

const port = Number(process.env.PORT) || 3001;

async function main() {
  await connectDb();
  startCronJobs();
  app.listen(port, '0.0.0.0', () => {
    console.log(`SIRIUS API listening on http://0.0.0.0:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
