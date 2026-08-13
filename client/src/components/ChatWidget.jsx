import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../stores/appStore'
import { useUserStore } from '../stores/userStore'
import api from '../lib/api'
import supabase from '../lib/supabase'
import { MessageCircle, Send, Trash2, X, Minimize2 } from 'lucide-react'

export default function ChatWidget() {
  const { t } = useAppStore()
  const { currentUser } = useUserStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastSeen, setLastSeen] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      const res = await api.get('/chat?limit=100')
      setMessages(res.data)
      setLastSeen(new Date().toISOString())
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    if (open) {
      scrollToBottom()
      setUnreadCount(0)
      setLastSeen(new Date().toISOString())
    }
  }, [open, messages])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('chat-widget')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        if (!open && payload.new.user_id !== currentUser?.id) {
          setUnreadCount(prev => prev + 1)
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, currentUser?.id])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const res = await api.post('/chat', { content: newMessage.trim() })
      setMessages(prev => [...prev, res.data])
      setNewMessage('')
      inputRef.current?.focus()
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const deleteMessage = async (id) => {
    try {
      await api.delete(`/chat/${id}`)
      setMessages(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const groupMessagesByDate = (msgs) => {
    const groups = []
    let currentDate = null

    for (const msg of msgs) {
      const msgDate = new Date(msg.created_at).toDateString()
      if (msgDate !== currentDate) {
        currentDate = msgDate
        const d = new Date(msg.created_at)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        let label = d.toLocaleDateString()
        if (d.toDateString() === today.toDateString()) label = t('chat.today') || 'Today'
        else if (d.toDateString() === yesterday.toDateString()) label = t('chat.yesterday') || 'Yesterday'
        groups.push({ date: label, messages: [] })
      }
      groups[groups.length - 1].messages.push(msg)
    }
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          open
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:shadow-primary-500/40'
        }`}
      >
        {open ? (
          <Minimize2 className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 left-6 z-50 w-80 h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="font-bold text-white text-sm">{t('chat.title') || 'Team Chat'}</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs">{t('chat.noMessages') || 'No messages yet'}</p>
              </div>
            ) : (
              messageGroups.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                    <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">{group.date}</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="space-y-2">
                    {group.messages.map((msg) => {
                      const isOwn = msg.user_id === currentUser?.id
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] group relative ${isOwn ? '' : ''}`}>
                            {!isOwn && (
                              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 px-1">
                                {msg.user_name}
                              </p>
                            )}
                            <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                              isOwn
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[9px] mt-0.5 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                            {(isOwn || currentUser?.role === 'MANAGER') && (
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className={`absolute top-0 ${isOwn ? '-left-6' : '-right-6'} opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-all`}
                              >
                                <Trash2 className="w-3 h-3 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-gray-200 dark:border-gray-700 p-2">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('chat.placeholder') || 'Type a message...'}
                disabled={sending}
                className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-8 h-8 rounded-lg bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
