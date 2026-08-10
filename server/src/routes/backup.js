import { Router } from 'express'
import { promises as fs } from 'fs'
import path from 'path'
import {
  backupToJson,
  backupToSql,
  restoreFromJson,
  listBackups,
  deleteBackup,
  cleanupOldBackups
} from '../services/backupService.js'

const router = Router()
const BACKUP_DIR = path.resolve(process.cwd(), 'backups')

router.get('/', async (req, res) => {
  try {
    const backups = await listBackups()
    res.json(backups)
  } catch (err) {
    console.error('List backups error:', err)
    res.status(500).json({ error: 'Failed to list backups' })
  }
})

router.post('/json', async (req, res) => {
  try {
    req.logActivity({ action: 'created', entity_type: 'backup', entity_name: 'JSON backup' })
    const result = await backupToJson()
    res.json({ message: 'JSON backup created', ...result })
  } catch (err) {
    console.error('JSON backup error:', err)
    res.status(500).json({ error: 'Failed to create backup' })
  }
})

router.post('/sql', async (req, res) => {
  try {
    req.logActivity({ action: 'created', entity_type: 'backup', entity_name: 'SQL backup' })
    const result = await backupToSql()
    res.json({ message: 'SQL backup created', ...result })
  } catch (err) {
    console.error('SQL backup error:', err)
    res.status(500).json({ error: 'Failed to create backup' })
  }
})

router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    const jsonPath = path.join(BACKUP_DIR, 'json', filename)
    const sqlPath = path.join(BACKUP_DIR, 'sql', filename)

    let filePath
    try { await fs.access(jsonPath); filePath = jsonPath } catch {}
    try { await fs.access(sqlPath); filePath = sqlPath } catch {}

    if (!filePath) return res.status(404).json({ error: 'Backup not found' })

    res.download(filePath, filename)
  } catch (err) {
    console.error('Download backup error:', err)
    res.status(500).json({ error: 'Failed to download backup' })
  }
})

router.post('/restore', async (req, res) => {
  try {
    const { filename } = req.body
    if (!filename) return res.status(400).json({ error: 'Filename is required' })

    const jsonPath = path.join(BACKUP_DIR, 'json', filename)
    try { await fs.access(jsonPath) } catch {
      return res.status(404).json({ error: 'JSON backup not found' })
    }

    req.logActivity({ action: 'restored', entity_type: 'backup', entity_name: filename })
    const result = await restoreFromJson(jsonPath)
    res.json({ message: 'Database restored', ...result })
  } catch (err) {
    console.error('Restore error:', err)
    res.status(500).json({ error: 'Failed to restore' })
  }
})

router.delete('/:filename', async (req, res) => {
  try {
    await deleteBackup(req.params.filename)
    req.logActivity({ action: 'deleted', entity_type: 'backup', entity_name: req.params.filename })
    res.json({ message: 'Backup deleted' })
  } catch (err) {
    console.error('Delete backup error:', err)
    res.status(500).json({ error: 'Failed to delete backup' })
  }
})

router.post('/cleanup', async (req, res) => {
  try {
    const days = parseInt(req.body.days) || 30
    const result = await cleanupOldBackups(days)
    res.json({ message: `Cleaned up backups older than ${days} days`, ...result })
  } catch (err) {
    console.error('Cleanup error:', err)
    res.status(500).json({ error: 'Failed to cleanup' })
  }
})

export { router as backupRouter }
