import cron from 'node-cron'
import { backupToJson, cleanupOldBackups } from './backupService.js'

const BACKUP_SCHEDULE = process.env.BACKUP_SCHEDULE || '0 2 * * *'
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30

export function startBackupScheduler() {
  if (process.env.BACKUP_ENABLED === 'false') {
    console.log('[CRON] Auto-backup disabled (BACKUP_ENABLED=false)')
    return
  }

  cron.schedule(BACKUP_SCHEDULE, async () => {
    console.log(`[CRON] Running scheduled backup at ${new Date().toISOString()}`)
    try {
      const result = await backupToJson()
      console.log(`[CRON] Backup completed: ${result.totalRows} rows`)
    } catch (err) {
      console.error('[CRON] Backup failed:', err)
    }
  })

  cron.schedule('0 3 * * 0', async () => {
    console.log(`[CRON] Running weekly cleanup at ${new Date().toISOString()}`)
    try {
      const result = await cleanupOldBackups(BACKUP_RETENTION_DAYS)
      console.log(`[CRON] Cleanup completed: ${result.deleted} old backups removed`)
    } catch (err) {
      console.error('[CRON] Cleanup failed:', err)
    }
  })

  console.log(`[CRON] Backup scheduled: ${BACKUP_SCHEDULE} (retention: ${BACKUP_RETENTION_DAYS} days)`)
}
