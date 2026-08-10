import cron from 'node-cron'
import { backupToJson, cleanupOldBackups } from './backupService.js'

const BACKUP_SCHEDULE = process.env.BACKUP_SCHEDULE || '0 2 * * *'
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30

let backupJob = null
let cleanupJob = null
let autoBackupEnabled = process.env.BACKUP_ENABLED !== 'false'
let lastBackupTime = null
let nextBackupTime = null

export function startBackupScheduler() {
  if (!autoBackupEnabled) {
    console.log('[CRON] Auto-backup disabled (BACKUP_ENABLED=false)')
    return
  }
  enableAutoBackup()
}

export function enableAutoBackup() {
  if (backupJob) backupJob.stop()

  backupJob = cron.schedule(BACKUP_SCHEDULE, async () => {
    console.log(`[CRON] Running scheduled backup at ${new Date().toISOString()}`)
    try {
      const result = await backupToJson()
      lastBackupTime = new Date().toISOString()
      console.log(`[CRON] Backup completed: ${result.totalRows} rows`)
    } catch (err) {
      console.error('[CRON] Backup failed:', err)
    }
  })

  if (cleanupJob) cleanupJob.stop()
  cleanupJob = cron.schedule('0 3 * * 0', async () => {
    console.log(`[CRON] Running weekly cleanup at ${new Date().toISOString()}`)
    try {
      const result = await cleanupOldBackups(BACKUP_RETENTION_DAYS)
      console.log(`[CRON] Cleanup completed: ${result.deleted} old backups removed`)
    } catch (err) {
      console.error('[CRON] Cleanup failed:', err)
    }
  })

  autoBackupEnabled = true
  nextBackupTime = getNextRunTime(BACKUP_SCHEDULE)
  console.log(`[CRON] Auto-backup ENABLED: ${BACKUP_SCHEDULE} (retention: ${BACKUP_RETENTION_DAYS} days)`)
}

export function disableAutoBackup() {
  if (backupJob) { backupJob.stop(); backupJob = null }
  if (cleanupJob) { cleanupJob.stop(); cleanupJob = null }
  autoBackupEnabled = false
  nextBackupTime = null
  console.log('[CRON] Auto-backup DISABLED')
}

export function getAutoBackupStatus() {
  return {
    enabled: autoBackupEnabled,
    schedule: BACKUP_SCHEDULE,
    retentionDays: BACKUP_RETENTION_DAYS,
    lastBackupTime,
    nextBackupTime,
  }
}

function getNextRunTime(schedule) {
  try {
    const interval = cron.getTimeout(schedule)
    if (interval > 0) {
      return new Date(Date.now() + interval).toISOString()
    }
  } catch {}
  return null
}
