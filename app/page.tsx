import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { translations, Language } from "@/utils/translations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import "./landing.css";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const lang: Language = profile?.language || 'en';
  const t = translations[lang];

  const signOut = async () => {
    'use server'
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect('/');
  }

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="container">
          <Link href="/" className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.85 8.15L21 9L16.5 13.5L17.5 19.5L12 16.5L6.5 19.5L7.5 13.5L3 9L9.15 8.15L12 2Z" fill="#2D5A27" />
            </svg>
            BloomGuard
          </Link>
          <ul className="nav-links">
            <li><a href="#features">{t.nav.features}</a></li>
            <li><a href="#app">{t.nav.app}</a></li>
            {user && (
              <li><Link href="/dashboard" style={{ fontWeight: '600' }}>{t.nav.dashboard}</Link></li>
            )}
            {profile?.role === 'admin' && (
              <li><Link href="/admin" style={{ color: '#E91E63', fontWeight: 'bold' }}>{t.nav.admin}</Link></li>
            )}
          </ul>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <LanguageSwitcher currentLang={lang} userId={user?.id} />
            {user ? (
              <>
                <span className="user-greeting">Hi, {profile?.full_name || user.email}</span>
                <form action={signOut}>
                  <button className="btn" style={{ border: '1px solid #2D5A27', color: '#2D5A27' }}>
                    {lang === 'uz' ? 'Chiqish' : 'Logout'}
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="btn btn-primary">{t.nav.login}</Link>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>{t.hero.title1}<br />{t.hero.title2}</h1>
            <p>{t.hero.subtitle}</p>
            <div className="hero-btns">
              <Link href={user ? "/dashboard" : "/login"} className="btn btn-primary">
                {user ? t.nav.dashboard : t.hero.cta_primary}
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <Image
              src="/hero.png"
              alt="BloomGuard Smart Sensor in a plant"
              width={600}
              height={600}
              priority
            />
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>{t.landing.features_title}</h2>
            <p>{t.landing.features_subtitle}</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3>{t.landing.f1_title}</h3>
              <p>{t.landing.f1_desc}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💧</div>
              <h3>{t.landing.f2_title}</h3>
              <p>{t.landing.f2_desc}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">☀️</div>
              <h3>{t.landing.f3_title}</h3>
              <p>{t.landing.f3_desc}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="app" className="app-section">
        <div className="container">
          <div className="app-image">
            <Image
              src="/app-mockup.png"
              alt="BloomGuard App Interface"
              width={500}
              height={800}
            />
          </div>
          <div className="app-content">
            <h2>{t.landing.app_title}</h2>
            <p>{t.landing.app_desc}</p>
            <ul style={{ listStyle: 'none', marginBottom: '2rem' }}>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#4CAF50' }}>✓</span> {t.landing.app_check1}
              </li>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#4CAF50' }}>✓</span> {t.landing.app_check2}
              </li>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#4CAF50' }}>✓</span> {t.landing.app_check3}
              </li>
            </ul>
            <a href="#" className="btn" style={{ background: 'white', color: '#1B3F16' }}>{t.landing.app_download}</a>
          </div>
        </div>
      </section>

      <section id="lifestyle" style={{ padding: '8rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-header">
            <h2>{t.landing.lifestyle_title}</h2>
            <p>{t.landing.lifestyle_desc}</p>
          </div>
          <div style={{ borderRadius: '40px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.1)' }}>
            <Image
              src="/lifestyle.png"
              alt="Living room with healthy plants"
              width={1200}
              height={600}
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        </div>
      </section>

      <section style={{ padding: '6rem 0', background: '#F1F8F1', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>{t.landing.cta_title}</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto 3rem', color: '#5C7A5C' }}>{t.landing.cta_subtitle}</p>
          <Link href={user ? "/dashboard" : "/login"} className="btn btn-primary" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem' }}>
            {user ? t.landing.cta_btn_user : t.landing.cta_btn_guest}
          </Link>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <Link href="/" className="logo" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>BloomGuard</Link>
              <p style={{ color: '#5C7A5C' }}>{t.landing.footer_desc}</p>
            </div>
            <div className="footer-col">
              <h4>{lang === 'uz' ? 'Mahsulot' : 'Product'}</h4>
              <ul>
                <li><a href="#">{lang === 'uz' ? 'Sensorlar' : 'Sensors'}</a></li>
                <li><a href="#">{lang === 'uz' ? 'Sug\'orish' : 'Irrigation'}</a></li>
                <li><a href="#">{lang === 'uz' ? 'Narxlar' : 'Pricing'}</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>{lang === 'uz' ? 'Kompaniya' : 'Company'}</h4>
              <ul>
                <li><a href="#">{lang === 'uz' ? 'Biz haqimizda' : 'About Us'}</a></li>
                <li><a href="#">{lang === 'uz' ? 'Karyera' : 'Careers'}</a></li>
                <li><a href="#">{lang === 'uz' ? 'Ta\'sir' : 'Impact'}</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>{lang === 'uz' ? 'Yordam' : 'Support'}</h4>
              <ul>
                <li><a href="#">{lang === 'uz' ? 'Yordam markazi' : 'Help Center'}</a></li>
                <li><a href="#">{lang === 'uz' ? 'Bog\'lanish' : 'Contact'}</a></li>
                <li><a href="#">{lang === 'uz' ? 'Maxfiylik' : 'Privacy'}</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{t.landing.footer_copy}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
