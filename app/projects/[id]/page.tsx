import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ChatWindow from "@/components/ChatWindow";
import { translations, Language } from "@/utils/translations";
import { cookies } from "next/headers";
import "@/app/landing.css";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect('/login');

    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (!project) return notFound();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const cookieStore = await cookies();
    const cookieLang = cookieStore.get('bloomguard_lang')?.value as Language;
    const lang: Language = profile?.language || cookieLang || 'uz';
    const t = translations[lang];

    if (project.owner_id !== user.id && profile?.role !== 'admin') {
        return redirect('/dashboard');
    }

    if (project.status !== 'approved' && profile?.role !== 'admin') {
        return (
            <div className="landing-page" style={{ padding: '8rem 0', textAlign: 'center' }}>
                <div className="container">
                    <h1 style={{ color: '#EF6C00' }}>{t.dashboard.pending}</h1>
                    <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: '2rem', display: 'inline-block' }}>{t.chat.back}</Link>
                </div>
            </div>
        );
    }

    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true });

    return (
        <div className="landing-page" style={{ padding: '4rem 0', minHeight: '100vh', background: '#F1F8F1' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div>
                        <Link href="/dashboard" style={{ color: '#2D5A27', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            ← {t.chat.back}
                        </Link>
                        <h1 style={{ color: '#2D5A27', marginTop: '0.5rem' }}>{project.name}</h1>
                    </div>
                </div>

                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <ChatWindow
                        projectId={id}
                        initialMessages={messages || []}
                        userId={user.id}
                        lang={lang}
                    />
                </div>
            </div>
        </div>
    );
}
