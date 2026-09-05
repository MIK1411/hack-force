import { useTranslation } from 'react-i18next';
import { languages } from '../lib/i18n';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <div className="relative group z-50">
      <div className="flex items-center gap-1 bg-[#141414] text-[#E4E3E0] px-2 py-1 text-[10px] font-mono cursor-pointer border border-[#E4E3E0] uppercase tracking-widest">
        <Globe className="w-3 h-3" />
        <span>{i18n.language.split('-')[0]}</span>
      </div>
      <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-white border border-[#141414] shadow-[4px_4px_0px_#141414] w-48 max-h-64 overflow-y-auto">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-[#F5F4F1] transition-colors border-b border-[#141414] last:border-0 ${i18n.language.startsWith(lang.code) ? 'font-bold bg-[#D9D8D5]' : ''}`}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}
