'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import "@/app/landing.css"

import { translations, Language } from '@/utils/translations'

export default function ChatWindow({ projectId, initialMessages, userId, lang = 'en' }: { projectId: string, initialMessages: any[], userId: string, lang?: Language }) {
    const [messages, setMessages] = useState(initialMessages)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const t = translations[lang]

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Subscription to new messages
    useEffect(() => {
        const channel = supabase
            .channel(`project-chat-${projectId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `project_id=eq.${projectId}`
            }, (payload) => {
                // Prevent duplicate addition if the local user just inserted it
                setMessages(prev => {
                    const exists = prev.find(m => m.id === payload.new.id)
                    return exists ? prev : [...prev, payload.new]
                })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId])

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setLoading(true)

        // 1. Insert user message into Supabase
        const { error: insertError } = await supabase
            .from('messages')
            .insert({
                project_id: projectId,
                user_id: userId,
                role: 'user',
                content: userMessage
            })

        if (insertError) {
            console.error(insertError)
            setLoading(false)
            return
        }

        // 2. Call our API route for Gemini response
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, message: userMessage })
            })

            if (!response.ok) throw new Error('AI failed to respond')
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '600px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '1.5rem', background: '#2D5A27', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🤖</div>
                <div>
                    <h3 style={{ fontSize: '1rem' }}>{t.chat.assistant_name}</h3>
                    <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>{t.chat.assistant_subtitle}</p>
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((m) => (
                    <div
                        key={m.id || Math.random()}
                        style={{
                            maxWidth: '80%',
                            padding: '1rem 1.5rem',
                            borderRadius: '20px',
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            background: m.role === 'user' ? '#E8F5E9' : '#F5F5F5',
                            color: '#000000',
                            borderBottomRightRadius: m.role === 'user' ? '4px' : '20px',
                            borderBottomLeftRadius: m.role === 'assistant' ? '4px' : '20px',
                        }}
                    >
                        <p style={{ fontSize: '0.95rem' }}>{m.content}</p>
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', background: '#F5F5F5', padding: '1rem', borderRadius: '20px', borderBottomLeftRadius: '4px' }}>
                        <p style={{ fontSize: '0.9rem', color: '#5C7A5C' }}>{t.chat.thinking}</p>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} style={{ padding: '1.5rem', borderTop: '1px solid #F0F0F0', display: 'flex', gap: '1rem' }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.chat.placeholder}
                    style={{ flex: 1, padding: '0.8rem 1.2rem', borderRadius: '50px', border: '1px solid #E0E0E0', outline: 'none' }}
                />
                <button
                    disabled={loading}
                    type="submit"
                    style={{ background: '#2D5A27', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    ➔
                </button>
            </form>
        </div>
    )
}
