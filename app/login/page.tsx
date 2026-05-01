'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { translations, Language } from '@/utils/translations'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import '../landing.css'

function AuthContent() {
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [loading, setLoading] = useState(false)
    const [lang, setLang] = useState<Language>('en')
    const searchParams = useSearchParams()
    const [message, setMessage] = useState<string | null>(searchParams.get('message'))

    useEffect(() => {
        const savedLang = localStorage.getItem('bloomguard_lang') as Language
        if (savedLang) setLang(savedLang)
    }, [])

    const t = translations[lang]
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                setMessage(error.message)
                setLoading(false)
            } else {
                router.push('/')
                router.refresh()
            }
        } else {
            const full_name = formData.get('full_name') as string
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name, language: lang },
                },
            })
            if (error) {
                setMessage(error.message)
                setLoading(false)
            } else {
                setMessage('Check your email to confirm your account.')
                setLoading(false)
            }
        }
    }

    return (
        <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F8F1', color: '#000000' }}>
            <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
                <LanguageSwitcher currentLang={lang} />
            </div>

            <div style={{ background: 'white', padding: '3rem', borderRadius: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', width: '100%', maxWidth: '450px' }}>
                <Link href="/" className="logo" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', color: '#2D5A27' }}>
                    BloomGuard
                </Link>

                <div style={{ display: 'flex', marginBottom: '2rem', background: '#F5F5F5', borderRadius: '12px', padding: '0.3rem' }}>
                    <button
                        onClick={() => setMode('login')}
                        style={{
                            flex: 1, padding: '0.8rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
                            background: mode === 'login' ? 'white' : 'transparent',
                            boxShadow: mode === 'login' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            fontWeight: mode === 'login' ? '600' : '400',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t.auth.login_tab}
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        style={{
                            flex: 1, padding: '0.8rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
                            background: mode === 'signup' ? 'white' : 'transparent',
                            boxShadow: mode === 'signup' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            fontWeight: mode === 'signup' ? '600' : '400',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t.auth.signup_tab}
                    </button>
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.8rem', color: '#000000' }}>
                    {mode === 'login' ? t.auth.welcome_back : t.auth.create_account}
                </h2>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col w-full justify-center gap-4">
                    {mode === 'signup' && (
                        <>
                            <label style={{ marginBottom: '0.5rem', fontWeight: '500', color: '#000000' }} htmlFor="full_name">{t.auth.full_name}</label>
                            <input
                                style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #E0E0E0', marginBottom: '1rem', color: '#000000' }}
                                name="full_name"
                                placeholder="John Doe"
                                required
                            />
                        </>
                    )}

                    <label style={{ marginBottom: '0.5rem', fontWeight: '500', color: '#000000' }} htmlFor="email">{t.auth.email}</label>
                    <input
                        style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #E0E0E0', marginBottom: '1rem', color: '#000000' }}
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                    />

                    <label style={{ marginBottom: '0.5rem', fontWeight: '500', color: '#000000' }} htmlFor="password">{t.auth.password}</label>
                    <input
                        style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #E0E0E0', marginBottom: '1.5rem', color: '#000000' }}
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? t.auth.processing : (mode === 'login' ? t.auth.submit_login : t.auth.submit_signup)}
                    </button>

                    {message && (
                        <p style={{ marginTop: '1rem', padding: '1rem', background: message.includes('Check') ? '#F1F8F1' : '#FFF4F4', color: message.includes('Check') ? '#2D5A27' : '#D32F2F', borderRadius: '12px', textAlign: 'center', fontSize: '0.9rem' }}>
                            {message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F8F1' }}>
                <div style={{ color: '#2D5A27', fontWeight: '600' }}>Loading...</div>
            </div>
        }>
            <AuthContent />
        </Suspense>
    )
}

