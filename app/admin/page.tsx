import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { translations, Language } from "@/utils/translations";
import { cookies } from "next/headers";
import "../landing.css";

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return redirect('/');
    }

    const cookieStore = await cookies();
    const cookieLang = cookieStore.get('bloomguard_lang')?.value as Language;
    const lang: Language = profile?.language || cookieLang || 'uz';
    const t = translations[lang];

    const { data: pendingProjects } = await supabase
        .from('projects')
        .select('*, profiles:owner_id(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    const { data: allUsers } = await supabase
        .from('profiles')
        .select('*');

    const updateStatus = async (formData: FormData) => {
        'use server'
        const projectId = formData.get('projectId') as string;
        const status = formData.get('status') as string;
        const supabase = await createClient();

        await supabase
            .from('projects')
            .update({ status })
            .eq('id', projectId);

        return redirect('/admin');
    }

    return (
        <div className="landing-page" style={{ padding: '6rem 0', background: '#F1F8F1', minHeight: '100vh' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ color: '#2D5A27' }}>{t.admin.panel_title}</h1>
                    <Link href="/" className="btn" style={{ border: '1px solid #2D5A27', color: '#2D5A27' }}>{t.admin.back_home}</Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                    {/* Project Approvals */}
                    <div>
                        <h2 style={{ marginBottom: '2rem' }}>{t.admin.notifications}</h2>
                        {pendingProjects?.length === 0 ? (
                            <p style={{ color: '#5C7A5C' }}>{t.admin.no_requests}</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {pendingProjects?.map((p: any) => (
                                    <div key={p.id} style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h3 style={{ color: '#2D5A27' }}>{p.name}</h3>
                                            <span style={{ fontSize: '0.8rem', color: '#5C7A5C' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ marginBottom: '1rem' }}>{p.description}</p>
                                        <p style={{ fontSize: '0.9rem', marginBottom: '2rem', color: '#5C7A5C' }}>{t.admin.requested_by}: <strong>{p.profiles?.full_name || 'Anonymous User'}</strong></p>

                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <form action={updateStatus}>
                                                <input type="hidden" name="projectId" value={p.id} />
                                                <input type="hidden" name="status" value="approved" />
                                                <button className="btn btn-primary" style={{ background: '#2E7D32' }}>{t.admin.approve}</button>
                                            </form>
                                            <form action={updateStatus}>
                                                <input type="hidden" name="projectId" value={p.id} />
                                                <input type="hidden" name="status" value="rejected" />
                                                <button className="btn" style={{ border: '1px solid #C62828', color: '#C62828' }}>{t.admin.reject}</button>
                                            </form>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* User Overview */}
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', height: 'fit-content' }}>
                        <h2 style={{ marginBottom: '2rem' }}>{t.admin.user_directory}</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem' }}>{t.admin.user_col}</th>
                                    <th style={{ textAlign: 'left', padding: '1rem' }}>{t.admin.role_col}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers?.map((u) => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                                        <td style={{ padding: '1rem' }}>{u.full_name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '10px',
                                                fontSize: '0.7rem',
                                                background: u.role === 'admin' ? '#FFEBEE' : '#E8F5E9',
                                                color: u.role === 'admin' ? '#C62828' : '#2E7D32'
                                            }}>{u.role}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
