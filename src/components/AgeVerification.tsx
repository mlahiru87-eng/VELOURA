import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ChevronDown, X, Info, ShieldAlert } from 'lucide-react';

interface AgeVerificationProps {
  onVerify: () => void;
}

type Language = 'en' | 'si' | 'es' | 'ta';

interface Translation {
  heading: string;
  noticeToUsers: string;
  warningText: string;
  noticeToLaw: string;
  enterBtn: string;
  exitBtn: string;
  noticeTitle: string;
  noticeContent: string;
  lawTitle: string;
  lawContent: string;
}

const TRANSLATIONS: Record<Language, Translation> = {
  en: {
    heading: "This is an adult website",
    noticeToUsers: "Notice to Users",
    warningText: "This website contains age-restricted materials including nudity and explicit depictions of sexual activity. By entering, you affirm that you are at least 18 years of age or the age of majority in the jurisdiction you are accessing the website from and you consent to viewing sexually explicit content.",
    noticeToLaw: "Notice to Law Enforcement",
    enterBtn: "I am 18 or older - Enter",
    exitBtn: "I am under 18 - Exit",
    noticeTitle: "Notice to Users",
    noticeContent: "Please read this notice carefully. You are entering a platform that hosts mature cinematic works and premium user-submitted video streams. We employ strictly secure local verification states. By entering, you agree to our Terms of Use, Privacy Guidelines, and Cookie Preferences.",
    lawTitle: "Notice to Law Enforcement",
    lawContent: "This platform operates in compliance with digital safety protocols. Content is sourced from legal open-source distributors. If you represent regulatory enforcement requiring assistance or standard audits, please contact the secure admin system console."
  },
  si: {
    heading: "මෙය වැඩිහිටියන් සඳහා වන වෙබ් අඩවියකි",
    noticeToUsers: "පරිශීලකයන් සඳහා වන දැනුම්දීම",
    warningText: "මෙම වෙබ් අඩවියේ නිරුවත සහ පැහැදිලි ලිංගික ක්‍රියාකාරකම් ඇතුළු වයස්-සීමිත ද්‍රව්‍ය අඩංගු වේ. ඇතුළු වීමෙන්, ඔබ අවම වශයෙන් වයස අවුරුදු 18 ක් හෝ ඔබ වෙබ් අඩවියට පිවිසෙන අධිකරණ බල ප්‍රදේශයේ බහුතර වයස සම්පූර්ණ කර ඇති බවත්, පැහැදිලි ලිංගික අන්තර්ගතයන් නැරඹීමට එකඟ වන බවත් තහවුරු කරයි.",
    noticeToLaw: "නීතිය බලාත්මක කිරීමේ ආයතන සඳහා වන දැනුම්දීම",
    enterBtn: "මා වයස අවුරුදු 18 හෝ ඊට වැඩි ය - ඇතුළු වන්න",
    exitBtn: "මා වයස අවුරුදු 18 ට අඩු ය - පිටවන්න",
    noticeTitle: "පරිශීලකයන් සඳහා වන දැනුම්දීම",
    noticeContent: "කරුණාකර මෙම දැනුම්දීම හොඳින් කියවන්න. ඔබ පිවිසෙන්නේ වැඩිහිටි සිනමා නිර්මාණ සහ වාරික වීඩියෝ අන්තර්ගතයන් සහිත පද්ධතියකටය. ප්‍රවේශය සඳහා අපි බ්‍රවුසරයේ දේශීය දත්ත භාවිත කරමු. ඉදිරියට යාමෙන් ඔබ අපගේ සේවා නියමයන් සහ රහස්‍යතා ප්‍රතිපත්තියට එකඟ වේ.",
    lawTitle: "නීතිය බලාත්මක කිරීමේ ආයතන සඳහා වන දැනුම්දීම",
    lawContent: "මෙම වෙබ් අඩවිය පුද්ගලික ආරක්ෂිත පරිසරයක ක්‍රියාත්මක වේ. සියලුම වීඩියෝ විවෘත මූලාශ්‍ර නීතිමය බෙදාහරින්නන්ගෙන් ලබාගෙන ඇත. නීතිමය විමසීම් සඳහා කරුණාකර අපගේ පද්ධති පරිපාලක අංශය අමතන්න."
  },
  es: {
    heading: "Este es un sitio web para adultos",
    noticeToUsers: "Aviso a los usuarios",
    warningText: "Este sitio web contiene materiales de edad restringida que incluyen desnudez y representaciones explícitas de actividad sexual. Al ingresar, afirma que tiene al menos 18 años de edad o la mayoría de edad en la jurisdicción desde la que accede al sitio web y que acepta ver contenido sexualmente explícito.",
    noticeToLaw: "Aviso a las fuerzas del orden",
    enterBtn: "Tengo 18 años o más - Entrar",
    exitBtn: "Soy menor de 18 años - Salir",
    noticeTitle: "Aviso a los usuarios",
    noticeContent: "Lea este aviso atentamente. Está ingresando a una plataforma que alberga obras cinematográficas para adultos y transmisiones de video premium. Empleamos estados de verificación local estrictamente seguros. Al ingresar, acepta nuestras Condiciones de uso.",
    lawTitle: "Aviso a las fuerzas del orden",
    lawContent: "Esta plataforma opera en cumplimiento de los protocolos de seguridad digital. El contenido proviene de distribuidores legales de código abierto. Si representa a la aplicación de la ley, comuníquese con el administrador."
  },
  ta: {
    heading: "இது ஒரு வயது வந்தோருக்கான வலைத்தளம்",
    noticeToUsers: "பயனர்களுக்கான அறிவிப்பு",
    warningText: "இந்த வலைத்தளத்தில் நிர்வாணம் மற்றும் வெளிப்படையான பாலியல் செயல்பாடுகள் உட்பட வயது வரம்பிற்குட்பட்ட பொருட்கள் உள்ளன. நுழைவதன் மூலம், உங்களுக்கு குறைந்தபட்சம் 18 வயது அல்லது நீங்கள் வலைத்தளத்தை அணுகும் அதிகார வரம்பில் பெரும்பான்மை வயது என்பதை உறுதிப்படுத்துகிறீர்கள் மற்றும் வெளிப்படையான பாலியல் உள்ளடக்கத்தைப் பார்க்க ஒப்புக்கொள்கிறீர்கள்.",
    noticeToLaw: "சட்ட அமலாக்கத்திற்கான அறிவிப்பு",
    enterBtn: "எனக்கு 18 அல்லது அதற்கு மேற்பட்ட வயது - உள்ளே நுழையவும்",
    exitBtn: "எனக்கு 18 வயதிற்குட்பட்டது - வெளியேறவும்",
    noticeTitle: "பயனர்களுக்கான அறிவிப்பு",
    noticeContent: "தயவுசெய்து இந்த அறிவிப்பை கவனமாகப் படிக்கவும். நீங்கள் வயது வந்தோருக்கான திரைப்பட படைப்புகள் மற்றும் பிரீமியம் வீடியோ உள்ளடக்கங்களைக் கொண்ட தளத்திற்குள் நுழைகிறீர்கள். அணுகுவதற்கு உலாவித் தரவை மட்டுமே பயன்படுத்துகிறோம்.",
    lawTitle: "சட்ட அமலாக்கத்திற்கான அறிவிப்பு",
    lawContent: "இந்தத் தளம் டிஜிட்டல் பாதுகாப்பு நெறிமுறைகளுக்கு இணங்க செயல்படுகிறது. ஏதேனும் சட்டரீதியான விசாரணைகளுக்கு எங்களின் நிர்வாகப் பிரிவைத் தொடர்பு கொள்ளவும்."
  }
};

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'si', name: 'සිංහල (Sinhala)', flag: '🇱🇰' },
  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇱🇰' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' }
];

export const AgeVerification: React.FC<AgeVerificationProps> = ({ onVerify }) => {
  const [lang, setLang] = useState<Language>('en');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'notice' | 'law' | null>(null);

  const t = TRANSLATIONS[lang];

  const handleDecline = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0A0A0C] text-zinc-100 font-sans select-none overflow-y-auto">
      
      {/* TOP HEADER: Language selection dropdown */}
      <header className="w-full flex items-center justify-between p-4 max-w-4xl mx-auto z-20">
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#15151B] border border-zinc-800 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
          >
            <Globe size={13} className="text-zinc-400" />
            <span>{LANGUAGES.find(l => l.code === lang)?.name}</span>
            <ChevronDown size={12} className={`text-zinc-500 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isLangOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsLangOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-1 w-44 rounded-md bg-[#15151B] border border-zinc-800 shadow-xl overflow-hidden z-40"
                >
                  {LANGUAGES.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setLang(item.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition cursor-pointer ${
                        lang === item.code 
                          ? 'bg-gold-500 text-white font-semibold' 
                          : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <span className="text-sm leading-none">{item.flag}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="text-[9px] font-mono text-zinc-600 tracking-wider">
          EST. 2026 • VAULT ID SECURE
        </div>
      </header>

      {/* CENTRAL WARNING PANEL CARD */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm flex flex-col items-center text-center space-y-6"
        >
          {/* Authentic VELOURA branding logo */}
          <div className="flex items-center gap-1 text-4xl font-sans tracking-tight">
            <span className="font-extrabold text-red-600 tracking-tight italic select-none transform hover:scale-105 transition-all duration-300">
              VELOURA
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {t.heading}
          </h1>

          {/* Notice to Users button */}
          <button
            onClick={() => setActiveModal('notice')}
            className="px-6 py-2.5 border border-gold-500 hover:bg-gold-500/10 text-white font-bold rounded-lg text-sm transition tracking-wide active:scale-[0.98] cursor-pointer shadow-lg shadow-black/20"
          >
            {t.noticeToUsers}
          </button>

          {/* Main detailed warning paragraph */}
          <p className="text-zinc-400 text-xs md:text-[13px] leading-relaxed text-center max-w-[340px]">
            {t.warningText}
          </p>

          {/* Notice to Law Enforcement link */}
          <button
            onClick={() => setActiveModal('law')}
            className="text-gold-400 hover:text-gold-300 font-bold text-xs tracking-wide transition active:scale-95 underline decoration-2 cursor-pointer"
          >
            {t.noticeToLaw}
          </button>

          {/* Large Action Buttons */}
          <div className="w-full space-y-3.5 pt-4">
            <button
              onClick={onVerify}
              className="w-full py-4 bg-[#14141A] border-2 border-gold-500 hover:bg-gold-500 hover:text-white text-white font-extrabold rounded-lg text-sm tracking-wider uppercase transition-all duration-300 shadow-xl shadow-black/40 active:scale-[0.99] cursor-pointer"
            >
              {t.enterBtn}
            </button>
            
            <button
              onClick={handleDecline}
              className="w-full py-4 bg-[#14141A] border-2 border-gold-500/40 hover:border-red-600 hover:bg-red-650/10 text-zinc-300 hover:text-red-400 font-extrabold rounded-lg text-sm tracking-wider uppercase transition-all duration-300 active:scale-[0.99] cursor-pointer"
            >
              {t.exitBtn}
            </button>
          </div>

        </motion.div>
      </main>

      {/* FOOTER LABEL */}
      <footer className="w-full text-center py-6 text-[10px] font-mono text-zinc-600 border-t border-zinc-900/40 mt-auto">
        <span>© 2026 VELOURA. ALL COMPLIANT POLICIES APPLY.</span>
      </footer>

      {/* DYNAMIC MODALS FOR NOTICES */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#121217] border border-gold-500/20 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={15} />
              </button>

              <div className="flex items-center gap-2 mb-4 text-gold-400">
                {activeModal === 'notice' ? (
                  <Info size={18} />
                ) : (
                  <ShieldAlert size={18} />
                )}
                <h3 className="font-serif font-bold text-white text-base">
                  {activeModal === 'notice' ? t.noticeTitle : t.lawTitle}
                </h3>
              </div>

              <p className="text-zinc-400 text-xs leading-relaxed font-mono">
                {activeModal === 'notice' ? t.noticeContent : t.lawContent}
              </p>

              <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 bg-gold-500 text-white font-extrabold rounded-lg text-xs tracking-wider uppercase cursor-pointer hover:bg-gold-400 transition"
                >
                  OK, Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
