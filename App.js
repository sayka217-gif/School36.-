import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trophy, 
  User as UserIcon, 
  Library as LibraryIcon, 
  LayoutDashboard, 
  Download, 
  BookOpen, 
  GraduationCap,
  ShieldCheck,
  Settings,
  Info,
  LogOut,
  Clock,
  X
} from 'lucide-react';
import { supabase } from './supabase.js';
import { translations } from './data.js';
import { useOrientation } from './hooks/useOrientation.js';
import Auth from './components/Auth.js';
import AdminPanel from './components/AdminPanel.js';
import TestPlayer from './components/TestPlayer.js';

const { useState, useEffect, useMemo, createElement: h } = React;

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState(() => localStorage.getItem('school_lang') || 'RUS');
  const [searchQuery, setSearchQuery] = useState('');
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [library, setLibrary] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const isLandscape = useOrientation();

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('school_lang', lang);
  }, [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('school_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchGlobalData();
  }, []);

  useEffect(() => {
    if (user) fetchUserData();
  }, [user]);

  const fetchGlobalData = async () => {
    const { data: tData } = await supabase.from('tests').select('*').eq('is_published', true);
    const { data: lData } = await supabase.from('library').select('*');
    setTests(tData || []);
    setLibrary(lData || []);
    setLoading(false);
  };

  const fetchUserData = async () => {
    const { data: rData } = await supabase
      .from('results')
      .select('*, tests(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setResults(rData || []);
  };

  const filteredTests = useMemo(() => {
    return tests.filter(test => 
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tests, searchQuery]);

  if (!user) {
    return h(Auth, { onAuthSuccess: setUser, t });
  }

  if (activeTest) {
    return h(TestPlayer, { 
      test: activeTest, 
      user, 
      t,
      onComplete: () => { setActiveTest(null); fetchUserData(); } 
    });
  }

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    const { error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', user.id);
    
    if (!error) {
      setPasswordSuccess(true);
      setNewPassword('');
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowSettings(false);
      }, 2000);
    }
  };

  const renderSettingsModal = () => {
    if (!showSettings) return null;

    return h('div', { className: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4' },
      h(motion.div, { 
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        className: 'bg-white w-full max-w-md rounded-3xl shadow-2xl p-8' 
      },
        h('div', { className: 'flex items-center justify-between mb-8' },
          h('h2', { className: 'text-2xl font-black text-blue-900' }, t.settings),
          h('button', { onClick: () => setShowSettings(false) }, h(X, { size: 24 }))
        ),
        
        h('div', { className: 'space-y-6' },
          h('div', { key: 'lang' },
            h('label', { className: 'block text-sm font-bold text-gray-400 mb-2 uppercase' }, t.language),
            h('div', { className: 'grid grid-cols-3 gap-2' },
              ['RUS', 'TJ', 'EN'].map(l => 
                h('button', {
                  key: l,
                  onClick: () => setLang(l),
                  className: `py-3 rounded-xl font-bold border-2 transition-all ${lang === l ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`
                }, l)
              )
            )
          ),
          
          h('div', { key: 'personal-info' },
            h('label', { className: 'block text-sm font-bold text-gray-400 mb-2 uppercase' }, t.personalInfo),
            h('div', { className: 'space-y-3' },
              h('div', { className: 'p-4 bg-gray-50 rounded-2xl' },
                h('p', { className: 'text-[10px] text-gray-400 font-bold uppercase mb-1' }, t.fullName),
                h('p', { className: 'font-bold text-gray-800' }, user.full_name)
              ),
              h('div', { className: 'p-4 bg-gray-50 rounded-2xl' },
                h('p', { className: 'text-[10px] text-gray-400 font-bold uppercase mb-1' }, t.class),
                h('p', { className: 'font-bold text-gray-800' }, user.student_class)
              )
            )
          ),

          h('div', { key: 'password-change' },
            h('label', { className: 'block text-sm font-bold text-gray-400 mb-2 uppercase' }, t.changePassword),
            h('div', { className: 'flex gap-2' },
              h('input', {
                type: 'password',
                placeholder: t.newPassword,
                className: 'flex-1 p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500',
                value: newPassword,
                onChange: (e) => setNewPassword(e.target.value)
              }),
              h('button', {
                onClick: handleUpdatePassword,
                className: 'px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700'
              }, t.save)
            ),
            passwordSuccess && h('p', { className: 'text-green-500 text-xs font-bold mt-2' }, t.passwordChanged)
          ),

          h('button', {
            onClick: () => setShowSettings(false),
            className: 'w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all'
          }, t.home)
        )
      )
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return h('div', { className: 'p-4 pb-24 md:pb-8' },
          h('div', { className: 'relative mb-6', key: 'search' },
            h(Search, { className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' }),
            h('input', {
              type: 'text',
              placeholder: t.search,
              className: 'w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none',
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value)
            })
          ),
          h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', key: 'grid' }, 
            filteredTests.map((test) => 
              h(motion.div, {
                key: test.id,
                layout: true,
                className: 'bg-white rounded-2xl overflow-hidden shadow-md border border-blue-50 hover:shadow-lg transition-all group'
              },
                h('div', { className: 'relative h-40 overflow-hidden', key: 'img' },
                  h('img', { 
                    src: test.image_url || `https://picsum.photos/seed/${test.id}/400/300`, 
                    className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500',
                    referrerPolicy: 'no-referrer'
                  }),
                  h('div', { className: 'absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg font-bold uppercase' }, test.category)
                ),
                h('div', { className: 'p-4', key: 'body' },
                  h('h3', { className: 'font-bold text-gray-800 mb-1 line-clamp-1' }, test.title),
                  h('div', { className: 'flex items-center gap-3 text-[10px] text-gray-400 font-bold mb-4' },
                    h('span', { className: 'flex items-center gap-1', key: 'q-count' }, h(Info, { size: 12 }), `${test.questions.length} савол`),
                    h('span', { className: 'flex items-center gap-1', key: 'duration' }, h(Clock, { size: 12 }), `${test.duration_minutes} дақиқа`)
                  ),
                  h('button', { 
                    onClick: () => setActiveTest(test),
                    className: 'w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100' 
                  }, t.startTest)
                )
              )
            )
          )
        );
      case 'results':
        return h('div', { className: 'p-4 pb-24 md:pb-8 max-w-2xl mx-auto' },
          h('h2', { className: 'text-2xl font-black text-blue-900 mb-6 flex items-center gap-2' }, h(Trophy, { className: 'text-yellow-500' }), t.results),
          h('div', { className: 'space-y-4' }, 
            results.length > 0 ? results.map(res => 
              h('div', { key: res.id, className: 'bg-white p-5 rounded-2xl shadow-sm border border-blue-50 flex items-center justify-between' },
                h('div', { key: 'info' },
                  h('h4', { className: 'font-bold text-gray-800' }, res.tests?.title),
                  h('p', { className: 'text-[10px] text-gray-400 font-bold' }, new Date(res.created_at).toLocaleDateString())
                ),
                h('div', { className: 'text-right flex items-center gap-4', key: 'score-section' },
                  h('div', { key: 'score' },
                    h('div', { className: 'text-2xl font-black text-blue-600' }, `${res.score}/${res.total_questions}`),
                    h('div', { className: 'text-[10px] uppercase font-bold text-gray-400' }, t.score)
                  ),
                  res.grade && h('div', { key: 'grade', className: 'bg-green-50 px-3 py-1 rounded-lg border border-green-100' },
                    h('div', { className: 'text-xl font-black text-green-600' }, res.grade),
                    h('div', { className: 'text-[8px] uppercase font-bold text-green-400' }, 'Баҳо')
                  )
                )
              )
            ) : h('div', { className: 'text-center p-12 text-gray-400 font-bold' }, t.noResults)
          )
        );
      case 'info':
        const subjectsTaken = [...new Set(results.map(r => r.tests?.category))].filter(Boolean);
        return h('div', { className: 'p-4 pb-24 md:pb-8 max-w-2xl mx-auto' },
          h('h2', { className: 'text-2xl font-black text-blue-900 mb-6 flex items-center gap-2' }, h(Info, { className: 'text-blue-600' }), t.studentInfo),
          h('div', { className: 'bg-white p-8 rounded-3xl shadow-sm border border-blue-50 space-y-6 mb-6' },
            h('div', { className: 'flex justify-between border-b pb-4', key: 'name' }, h('span', { className: 'text-gray-400 font-bold' }, `${t.fullName}:`), h('span', { className: 'font-bold' }, user.full_name)),
            h('div', { className: 'flex justify-between border-b pb-4', key: 'class' }, h('span', { className: 'text-gray-400 font-bold' }, `${t.class}:`), h('span', { className: 'font-bold' }, user.student_class)),
            h('div', { className: 'flex justify-between border-b pb-4', key: 'phone' }, h('span', { className: 'text-gray-400 font-bold' }, `${t.phone}:`), h('span', { className: 'font-bold' }, user.phone)),
            h('div', { className: 'flex justify-between', key: 'role' }, h('span', { className: 'text-gray-400 font-bold' }, `${t.status}:`), h('span', { className: 'font-bold text-blue-600 uppercase' }, user.role))
          ),
          h('div', { className: 'bg-white p-8 rounded-3xl shadow-sm border border-blue-50' },
            h('h3', { className: 'font-bold text-gray-800 mb-4' }, t.testsTaken),
            h('div', { className: 'flex flex-wrap gap-2' }, 
              subjectsTaken.length > 0 ? subjectsTaken.map(sub => 
                h('span', { key: sub, className: 'px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm' }, sub)
              ) : h('p', { className: 'text-gray-400 text-sm' }, t.noTestsTaken)
            )
          )
        );
      case 'profile':
        const isAdmin = ['main_admin', 'admin', 'zavuch', 'rukovoditel'].includes(user.role);
        return h('div', { className: 'p-4 pb-24 md:pb-8 max-w-md mx-auto' },
          h('div', { className: 'bg-white rounded-3xl shadow-xl overflow-hidden border border-blue-50' },
            h('div', { className: 'bg-blue-600 h-32 relative' },
              h('div', { className: 'absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full p-1 shadow-lg' },
                h('div', { className: 'w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600' }, h(UserIcon, { size: 48 }))
              )
            ),
            h('div', { className: 'pt-16 pb-8 px-8 text-center' },
              h('h3', { className: 'text-2xl font-black text-gray-800' }, user.full_name),
              h('p', { className: 'text-gray-500 mb-8' }, `${user.student_class} синф`),
              
              h('div', { className: 'space-y-3' },
                h('button', { 
                  key: 'settings', 
                  onClick: () => setShowSettings(true),
                  className: 'w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-600 flex items-center gap-3 hover:bg-gray-100 transition-colors' 
                }, h(Settings, { size: 20 }), t.settings),
                isAdmin && h('button', { 
                  key: 'admin',
                  onClick: () => setShowAdmin(true),
                  className: 'w-full p-4 bg-blue-50 text-blue-600 rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-100 transition-colors' 
                }, h(ShieldCheck, { size: 20 }), t.adminPanel),
                h('button', { 
                  key: 'logout',
                  onClick: () => { 
                    localStorage.removeItem('school_user'); 
                    setUser(null); 
                    setActiveTab('home');
                  },
                  className: 'w-full p-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center gap-3 hover:bg-red-100 transition-colors' 
                }, h(LogOut, { size: 20 }), t.logout)
              )
            )
          )
        );
      case 'library':
        return h('div', { className: 'p-4 pb-24 md:pb-8' },
          h('h2', { className: 'text-2xl font-black text-blue-900 mb-6 flex items-center gap-2' }, h(LibraryIcon, { className: 'text-blue-600' }), t.library),
          h('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6' }, 
            library.map(book => 
              h('div', { key: book.id, className: 'flex flex-col group' },
                h('div', { className: 'relative aspect-[2/3] rounded-xl overflow-hidden shadow-md mb-3 bg-blue-100 flex items-center justify-center', key: 'cover' },
                  h(BookOpen, { size: 48, className: 'text-blue-300' }),
                  h('div', { className: 'absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2' },
                    h('a', { href: book.file_url, target: '_blank', className: 'p-2 bg-white rounded-full text-blue-600' }, h(Download, { size: 20 }))
                  )
                ),
                h('h4', { className: 'font-bold text-sm text-gray-800 line-clamp-2', key: 'title' }, book.title),
                h('p', { className: 'text-[10px] text-gray-400 font-bold uppercase', key: 'class' }, `${book.student_class} синф`)
              )
            )
          )
        );
    }
  };

  return h('div', { className: `min-h-screen bg-[#F8FAFC] text-gray-900 font-sans ${isLandscape ? 'landscape-mode' : 'portrait-mode'}` },
    h('header', { className: 'bg-white border-b border-blue-50 sticky top-0 z-40 px-4 py-4 flex items-center justify-between', key: 'header' },
      h('div', { className: 'flex items-center gap-3', key: 'logo' },
        h('div', { className: 'w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200' }, h(GraduationCap, { size: 24 })),
        h('div', { key: 'text' },
          h('h1', { className: 'font-black text-lg text-blue-900 leading-none', key: 'name' }, 'School 36'),
          h('p', { className: 'text-[10px] text-blue-400 font-bold uppercase tracking-tighter', key: 'sub' }, 'St. Shohmansur')
        )
      ),
      h('div', { className: 'hidden md:flex items-center gap-6', key: 'desktop-nav' },
        h('button', { key: 'home', onClick: () => setActiveTab('home'), className: `text-sm font-bold transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}` }, t.home),
        h('button', { key: 'results', onClick: () => setActiveTab('results'), className: `text-sm font-bold transition-colors ${activeTab === 'results' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}` }, t.results),
        h('button', { key: 'info', onClick: () => setActiveTab('info'), className: `text-sm font-bold transition-colors ${activeTab === 'info' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}` }, t.info),
        h('button', { key: 'library', onClick: () => setActiveTab('library'), className: `text-sm font-bold transition-colors ${activeTab === 'library' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}` }, t.library),
        h('button', { key: 'profile', onClick: () => setActiveTab('profile'), className: `text-sm font-bold transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}` }, t.profile)
      )
    ),
    h('main', { className: 'max-w-7xl mx-auto', key: 'main' },
      h(AnimatePresence, { mode: 'wait' },
        h(motion.div, {
          key: activeTab,
          initial: { opacity: 0, x: 10 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -10 },
          transition: { duration: 0.2 }
        }, renderContent())
      )
    ),
    h('nav', { className: 'md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-blue-50 px-6 py-3 flex items-center justify-between z-50', key: 'mobile-nav' },
      h(NavButton, { key: 'home', active: activeTab === 'home', onClick: () => setActiveTab('home'), icon: h(LayoutDashboard, { size: 24 }), label: t.home }),
      h(NavButton, { key: 'results', active: activeTab === 'results', onClick: () => setActiveTab('results'), icon: h(Trophy, { size: 24 }), label: t.results }),
      h(NavButton, { key: 'info', active: activeTab === 'info', onClick: () => setActiveTab('info'), icon: h(Info, { size: 24 }), label: t.info }),
      h(NavButton, { key: 'library', active: activeTab === 'library', onClick: () => setActiveTab('library'), icon: h(LibraryIcon, { size: 24 }), label: t.library }),
      h(NavButton, { key: 'profile', active: activeTab === 'profile', onClick: () => setActiveTab('profile'), icon: h(UserIcon, { size: 24 }), label: t.profile })
    ),
    showAdmin && h(AdminPanel, { key: 'admin-panel', user, t, onClose: () => setShowAdmin(false) }),
    renderSettingsModal()
  );
}

function NavButton({ active, onClick, icon, label }) {
  return h('button', {
    onClick,
    className: `flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600 scale-110' : 'text-gray-400'}`
  },
    h('div', { className: active ? 'bg-blue-50 p-2 rounded-xl' : '', key: 'icon' }, icon),
    h('span', { className: 'text-[10px] font-bold', key: 'label' }, label)
  );
}
