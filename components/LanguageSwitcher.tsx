'use client'

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Language } from '@/utils/translations';

interface LanguageSwitcherProps {
    currentLang: Language;
    userId?: string;
}

export default function LanguageSwitcher({ currentLang, userId }: LanguageSwitcherProps) {
    const router = useRouter();
    const supabase = createClient();

    const handleLanguageChange = async (lang: Language) => {
        if (userId) {
            // Save to profile
            await supabase
                .from('profiles')
                .update({ language: lang })
                .eq('id', userId);
        }

        // Save to local storage for guest use
        localStorage.setItem('bloomguard_lang', lang);

        // Save to cookie for server-side access
        document.cookie = `bloomguard_lang=${lang}; path=/; max-age=31536000`;

        // Reload to apply changes immediately across all components
        window.location.reload();
    };

    return (
        <div className="language-switcher">
            <select
                value={currentLang}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="lang-select"
            >
                <option value="en">English 🇺🇸</option>
                <option value="uz">O'zbek 🇺🇿</option>
            </select>

            <style jsx>{`
        .lang-select {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(45, 90, 39, 0.2);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          color: #2d5a27;
          font-weight: 500;
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
        }
        .lang-select:hover {
          background: rgba(45, 90, 39, 0.05);
        }
      `}</style>
        </div>
    );
}
