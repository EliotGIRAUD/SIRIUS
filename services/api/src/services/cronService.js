import cron from 'node-cron';
import { closeAllActiveDays } from './simulationService.js';

export function startCronJobs() {
  cron.schedule('0 0 * * *', async () => {
    try {
      const results = await closeAllActiveDays();
      console.log(`Cron: ${results.filter(Boolean).length} jour(s) clôturé(s)`);
    } catch (err) {
      console.error('Cron error:', err);
    }
  });

  console.log('Cron jobs scheduled (midnight daily day close)');
}
