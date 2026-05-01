import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { translations, Language } from "@/utils/translations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cookies } from "next/headers";
import "../landing.css";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const cookieStore = await cookies();
    const cookieLang = cookieStore.get('bloomguard_lang')?.value as Language;
    const lang: Language = profile?.language || cookieLang || 'uz';
    const t = translations[lang];

    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

    const createProject = async (formData: FormData) => {
        'use server'
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            await supabase
                .from('projects')
                .insert({ name, description, owner_id: user.id, status: 'pending' });
        }
        return redirect('/dashboard');
    }

    const generateTelegramCode = async () => {
        'use server'
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await supabase
            .from('profiles')
            .update({
                telegram_link_code: code,
                telegram_link_expires_at: expiresAt
            })
            .eq('id', user.id);

        return redirect('/dashboard');
    }

    return (
        <div className="dashboard-page" style={{ padding: '6rem 0', minHeight: '100vh', background: '#F1F8F1' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ color: '#2D5A27' }}>{t.dashboard.title}</h1>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <LanguageSwitcher currentLang={lang} userId={user.id} />
                        <Link href="/" className="btn" style={{ border: '1px solid #2D5A27', color: '#2D5A27' }}>{t.dashboard.back_home}</Link>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem' }}>
                    <div style={{ position: 'sticky', top: '100px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>📱</span> {t.dashboard.telegram_title}
                            </h3>
                            {profile?.telegram_id ? (
                                <div style={{ color: '#2E7D32', background: '#E8F5E9', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                    <strong>{t.dashboard.telegram_linked} ✅</strong>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ fontSize: '0.9rem', color: '#5C7A5C', marginBottom: '1.5rem' }}>
                                        {t.dashboard.telegram_info}
                                    </p>
                                    {profile?.telegram_link_code ? (
                                        <div style={{ textAlign: 'center', background: '#F5F5F5', padding: '1.5rem', borderRadius: '16px', border: '2px dashed #E0E0E0' }}>
                                            <span style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '4px', color: '#2D5A27' }}>
                                                {profile.telegram_link_code}
                                            </span>
                                        </div>
                                    ) : (
                                        <form action={generateTelegramCode}>
                                            <button className="btn" style={{ width: '100%', border: '1px solid #2D5A27', color: '#2D5A27' }}>
                                                {t.dashboard.generate_code}
                                            </button>
                                        </form>
                                    )}
                                    <p style={{ fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
                                        {t.dashboard.send_code} <strong>@BloomGuardBot</strong>
                                    </p>
                                </div>
                            )}
                        </div>

                        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{t.dashboard.request_title}</h3>
                            <form action={createProject}>
                                <input
                                    name="name"
                                    required
                                    placeholder={t.dashboard.project_name}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E0E0E0', marginBottom: '1rem' }}
                                />
                                <textarea
                                    name="description"
                                    rows={4}
                                    placeholder={t.dashboard.desc_placeholder}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E0E0E0', marginBottom: '1.5rem', fontFamily: 'inherit' }}
                                />

                                <button className="btn btn-primary" style={{ width: '100%' }}>{t.dashboard.submit}</button>
                            </form>
                        </div>
                    </div>

                    {/* Projects List */}
                    <div>
                        {projects?.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.5)', borderRadius: '24px' }}>
                                <p style={{ color: '#5C7A5C' }}>{t.dashboard.no_projects}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {projects?.map((project) => (
                                    <div key={project.id} style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ marginBottom: '0.5rem' }}>{project.name}</h3>
                                                <p style={{ color: '#5C7A5C', fontSize: '0.9rem', marginBottom: '1rem' }}>{project.description}</p>
                                            </div>
                                            <span style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '50px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                background: project.status === 'approved' ? '#E8F5E9' : project.status === 'rejected' ? '#FFEBEE' : '#FFF3E0',
                                                color: project.status === 'approved' ? '#2E7D32' : project.status === 'rejected' ? '#C62828' : '#EF6C00'
                                            }}>
                                                {project.status === 'approved' && (lang === 'uz' ? 'Tasdiqlangan' : 'Approved')}
                                                {project.status === 'pending' && (lang === 'uz' ? 'Kutilmoqda' : 'Pending')}
                                                {project.status === 'rejected' && (lang === 'uz' ? 'Rad etilgan' : 'Rejected')}
                                            </span>
                                        </div>

                                        {project.status === 'approved' && (
                                            <Link
                                                href={`/projects/${project.id}`}
                                                className="btn btn-primary"
                                                style={{ marginTop: '1rem', display: 'inline-block', fontSize: '0.9rem' }}
                                            >
                                                {t.dashboard.enter_chat}
                                            </Link>
                                        )}
                                        {project.status === 'pending' && (
                                            <p style={{ fontSize: '0.8rem', color: '#EF6C00', marginTop: '1rem' }}>{t.dashboard.pending}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
