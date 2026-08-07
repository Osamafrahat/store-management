import { Router } from 'express'
import supabase from '../db/supabase.js'

const router = Router()

// Trial Balance
router.get('/trial-balance', async (req, res) => {
  try {
    const { period_id } = req.query
    let query = supabase
      .from('accounts')
      .select('id, code, name, account_type, balance')
      .eq('is_active', true)
      .order('code')

    const { data: accounts, error } = await query
    if (error) throw error

    // Group by type
    const grouped = {
      asset: accounts.filter(a => a.account_type === 'asset'),
      liability: accounts.filter(a => a.account_type === 'liability'),
      equity: accounts.filter(a => a.account_type === 'equity'),
      revenue: accounts.filter(a => a.account_type === 'revenue'),
      expense: accounts.filter(a => a.account_type === 'expense'),
    }

    const totalDebit = accounts
      .filter(a => ['asset', 'expense'].includes(a.account_type) && a.balance > 0)
      .reduce((sum, a) => sum + a.balance, 0)

    const totalCredit = accounts
      .filter(a => ['liability', 'equity', 'revenue'].includes(a.account_type) && a.balance > 0)
      .reduce((sum, a) => sum + a.balance, 0)

    // Also include negative balances on the opposite side
    const totalDebitAll = accounts
      .filter(a => a.balance > 0)
      .reduce((sum, a) => {
        if (['asset', 'expense'].includes(a.account_type)) return sum + a.balance
        return sum
      }, 0)

    const totalCreditAll = accounts
      .filter(a => a.balance > 0)
      .reduce((sum, a) => {
        if (['liability', 'equity', 'revenue'].includes(a.account_type)) return sum + a.balance
        return sum
      }, 0)

    res.json({
      accounts: grouped,
      totalDebit: totalDebitAll,
      totalCredit: totalCreditAll,
      isBalanced: Math.abs(totalDebitAll - totalCreditAll) < 0.01,
    })
  } catch (err) {
    console.error('Trial balance error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Balance Sheet
router.get('/balance-sheet', async (req, res) => {
  try {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, code, name, account_type, balance')
      .eq('is_active', true)
      .in('account_type', ['asset', 'liability', 'equity'])
      .order('code')

    if (error) throw error

    const assets = accounts.filter(a => a.account_type === 'asset')
    const liabilities = accounts.filter(a => a.account_type === 'liability')
    const equity = accounts.filter(a => a.account_type === 'equity')

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0)
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0)
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0)

    res.json({
      assets: { items: assets, total: totalAssets },
      liabilities: { items: liabilities, total: totalLiabilities },
      equity: { items: equity, total: totalEquity },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    })
  } catch (err) {
    console.error('Balance sheet error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Profit & Loss Statement
router.get('/profit-loss', async (req, res) => {
  try {
    const { date_from, date_to } = req.query

    let entryQuery = supabase
      .from('journal_entry_lines')
      .select('debit, credit, accounts(code, name, account_type), journal_entries!inner(date)')

    if (date_from) entryQuery = entryQuery.gte('journal_entries.date', date_from)
    if (date_to) entryQuery = entryQuery.lte('journal_entries.date', date_to)

    const { data: lines, error } = await entryQuery
    if (error) throw error

    // Group by revenue and expense accounts
    const revenueMap = {}
    const expenseMap = {}

    for (const line of lines) {
      const account = line.accounts
      if (!account) continue

      if (account.account_type === 'revenue') {
        if (!revenueMap[account.code]) revenueMap[account.code] = { ...account, total: 0 }
        revenueMap[account.code].total += line.credit - line.debit
      }
      if (account.account_type === 'expense') {
        if (!expenseMap[account.code]) expenseMap[account.code] = { ...account, total: 0 }
        expenseMap[account.code].total += line.debit - line.credit
      }
    }

    const revenues = Object.values(revenueMap)
    const expenses = Object.values(expenseMap)
    const totalRevenue = revenues.reduce((sum, r) => sum + r.total, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0)
    const netIncome = totalRevenue - totalExpenses

    res.json({
      revenues,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome,
    })
  } catch (err) {
    console.error('Profit & loss error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get account ledger (transactions for a specific account)
router.get('/account-ledger/:accountId', async (req, res) => {
  try {
    const { date_from, date_to } = req.query

    let query = supabase
      .from('journal_entry_lines')
      .select('*, journal_entries!inner(entry_number, date, description, source_type)')
      .eq('account_id', req.params.accountId)
      .order('journal_entries.date', { ascending: false })

    if (date_from) query = query.gte('journal_entries.date', date_from)
    if (date_to) query = query.lte('journal_entries.date', date_to)

    const { data, error } = await query
    if (error) throw error

    const { data: account } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', req.params.accountId)
      .single()

    // Calculate running balance
    let runningBalance = 0
    const transactions = data.reverse().map(line => {
      if (['asset', 'expense'].includes(account?.account_type)) {
        runningBalance += line.debit - line.credit
      } else {
        runningBalance += line.credit - line.debit
      }
      return { ...line, balance: runningBalance }
    })

    res.json({ account, transactions: transactions.reverse() })
  } catch (err) {
    console.error('Account ledger error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Fiscal periods
router.get('/fiscal-periods', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fiscal_periods')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Get fiscal periods error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Close fiscal period
router.post('/fiscal-periods/:id/close', async (req, res) => {
  try {
    const { data: period } = await supabase
      .from('fiscal_periods')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (!period) return res.status(404).json({ error: 'Period not found' })
    if (period.is_closed) return res.status(400).json({ error: 'Period is already closed' })

    // Post net income to retained earnings
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, account_type, balance')

    const revenue = accounts.filter(a => a.account_type === 'revenue')
    const expenses = accounts.filter(a => a.account_type === 'expense')
    const netIncome = revenue.reduce((s, a) => s + a.balance, 0) - expenses.reduce((s, a) => s + a.balance, 0)

    if (Math.abs(netIncome) > 0.01) {
      const { data: retainedEarnings } = await supabase.from('accounts').select('id').eq('code', '3020').single()
      const { data: cyeAccount } = await supabase.from('accounts').select('id, balance').eq('code', '3030').single()
      const { data: revenueAccounts } = await supabase.from('accounts').select('id').eq('account_type', 'revenue')
      const { data: expenseAccounts } = await supabase.from('accounts').select('id').eq('account_type', 'expense')

      if (retainedEarnings) {
        const lines = []

        // Close revenue accounts (debit them to zero)
        for (const acc of revenueAccounts || []) {
          const acct = accounts.find(a => a.id === acc.id)
          if (acct && acct.balance > 0) {
            lines.push({ accountId: acc.id, debit: acct.balance, credit: 0, description: 'Year-end closing' })
          }
        }

        // Close expense accounts (credit them to zero)
        for (const acc of expenseAccounts || []) {
          const acct = accounts.find(a => a.id === acc.id)
          if (acct && acct.balance > 0) {
            lines.push({ accountId: acc.id, debit: 0, credit: acct.balance, description: 'Year-end closing' })
          }
        }

        // Transfer Current Year Earnings (3030) to Retained Earnings (3020)
        if (cyeAccount && Math.abs(cyeAccount.balance) > 0.01) {
          if (cyeAccount.balance > 0) {
            // Net income: debit 3030, credit 3020
            lines.push({ accountId: cyeAccount.id, debit: cyeAccount.balance, credit: 0, description: 'Close current year earnings' })
            lines.push({ accountId: retainedEarnings.id, debit: 0, credit: cyeAccount.balance, description: 'Transfer net income to retained earnings' })
          } else {
            // Net loss: debit 3020, credit 3030
            lines.push({ accountId: retainedEarnings.id, debit: Math.abs(cyeAccount.balance), credit: 0, description: 'Transfer net loss to retained earnings' })
            lines.push({ accountId: cyeAccount.id, debit: 0, credit: Math.abs(cyeAccount.balance), description: 'Close current year earnings' })
          }
        }

        if (lines.length > 0) {
          const { createJournalEntry } = await import('../services/accountingEngine.js')
          await createJournalEntry({
            date: period.end_date,
            description: `Year-end closing for ${period.name}`,
            sourceType: 'closing',
            lines,
            createdBy: req.user?.id,
          })
        }
      }
    }

    // Close the period
    await supabase
      .from('fiscal_periods')
      .update({
        is_closed: true,
        closed_by: req.user?.id,
        closed_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)

    res.json({ message: 'Fiscal period closed successfully' })
  } catch (err) {
    console.error('Close fiscal period error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as accountingReportsRouter }
