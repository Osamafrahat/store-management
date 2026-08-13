import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../stores/appStore'
import { useUserStore } from '../stores/userStore'
import api from '../lib/api'
import supabase from '../lib/supabase'
import { Send, Trash2, MessageCircle, Users } from 'lucide-react'

export default function ChatPage() {
  const { t } = useAppStore()
  const { currentUser } = useUserStore()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const res = await api.get('/chat?limit=200')
      setMessages(res.data)
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
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
  }, [])

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
    if (!confirm(t('chat.deleteConfirm') || 'Delete this message?')) return
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

  const formatDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return t('chat.today') || 'Today'
    if (d.toDateString() === yesterday.toDateString()) return t('chat.yesterday') || 'Yesterday'
    return d.toLocaleDateString()
  }

  const groupMessagesByDate = (msgs) => {
    const groups = []
    let currentDate = null

    for (const msg of msgs) {
      const msgDate = new Date(msg.created_at).toDateString()
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msg.created_at, messages: [] })
      }
      groups[groups.length - 1].messages.push(msg)
    }
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl border border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{t('chat.title') || 'Team Chat'}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {t('chat.allMembers') || 'All team members'}
            </p>
          </div>
        </div>
        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
          {t('chat.online') || 'Online'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 border-x border-gray-200 dark:border-gray-700 p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">{t('chat.noMessages') || 'No messages yet'}</p>
            <p className="text-sm">{t('chat.startConversation') || 'Start a conversation with your team'}</p>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">
                  {formatDate(group.date)}
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {group.messages.map((msg) => {
                  const isOwn = msg.user_id === currentUser?.id
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                        {!isOwn && (
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-1">
                            {msg.user_name}
                          </p>
                        )}
                        <div className={`group relative px-4 py-2.5 rounded-2xl ${
                          isOwn
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                          {(isOwn || currentUser?.role === 'MANAGER') && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className={`absolute top-1 ${isOwn ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          )}
                        </div>
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
      <form onSubmit={sendMessage} className="bg-white dark:bg-gray-800 rounded-b-2xl border border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat.placeholder') || 'Type a message...'}
            disabled={sending}
            className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
