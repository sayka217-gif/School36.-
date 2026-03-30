import React from 'react';
import { supabase } from '../supabase.js';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Library, 
  Plus, 
  Trash2, 
  Edit, 
  Search,
  X,
  Eye,
  CheckCircle2,
  Calendar,
  Upload,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const { useState, useEffect, useMemo, createElement: h } = React;

export default function AdminPanel({ user, onClose, t }) {
  const [activeSection, setActiveSection] = useState('subjects');
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for adding/editing test
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration_minutes: 20,
    is_published: true,
    questions: [{ q: '', a: '', b: '', c: '', d: '', correct: 'a' }],
    image_url: ''
  });

  const [bookFormData, setBookFormData] = useState({
    title: '',
    file_url: '',
    student_class: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [tRes, rRes, sRes, lRes] = await Promise.all([
      supabase.from('tests').select('*'),
      supabase.from('results').select('*, users(*), tests(*)'),
      supabase.from('users').select('*'),
      supabase.from('library').select('*')
    ]);
    setTests(tRes.data || []);
    setResults(rRes.data || []);
    setStudents(sRes.data || []);
    setLibrary(lRes.data || []);
    setLoading(false);
  };

  const handleSaveTest = async () => {
    const { data, error } = await supabase
      .from('tests')
      .upsert([{ ...formData, created_by: user.id }])
      .select();
    
    if (!error) {
      fetchData();
      setShowAddModal(false);
      setFormData({
        title: '', description: '', category: '', duration_minutes: 20, is_published: true,
        questions: [{ q: '', a: '', b: '', c: '', d: '', correct: 'a' }], image_url: ''
      });
    }
  };

  const handleSaveBook = async () => {
    if (!bookFormData.title || !bookFormData.file_url) return;
    
    const { error } = await supabase
      .from('library')
      .upsert([bookFormData]);
    
    if (!error) {
      fetchData();
      setBookSuccess(true);
      setTimeout(() => {
        setBookSuccess(false);
        setShowBookModal(false);
        setBookFormData({ title: '', file_url: '', student_class: '' });
      }, 2000);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `books/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('library')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('library')
        .getPublicUrl(filePath);

      setBookFormData({ ...bookFormData, file_url: publicUrl });
    } catch (error) {
      console.error('Error uploading file:', error.message);
      setUploadError('Error uploading file. Please make sure the "library" bucket exists in Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const deleteTest = async (id) => {
    await supabase.from('tests').delete().eq('id', id);
    fetchData();
  };

  const renderSidebar = () => {
    const menuItems = [
      { id: 'subjects', label: t.subjects, icon: LayoutDashboard, roles: ['main_admin', 'admin', 'zavuch'] },
      { id: 'results', label: t.results, icon: CheckCircle2, roles: ['main_admin', 'admin', 'zavuch', 'rukovoditel'] },
      { id: 'analytics', label: t.analytics, icon: BarChart3, roles: ['main_admin', 'admin', 'zavuch', 'rukovoditel'] },
      { id: 'students', label: t.studentsBase, icon: Users, roles: ['main_admin', 'admin'] },
      { id: 'library', label: t.library, icon: Library, roles: ['main_admin', 'admin'] },
      { id: 'settings', label: t.settings, icon: Settings, roles: ['main_admin', 'admin'] }
    ];

    return h('div', { className: 'w-64 bg-white border-r border-blue-100 flex flex-col' },
      h('div', { className: 'p-6 border-b border-blue-50' },
        h('h2', { className: 'text-xl font-black text-blue-900' }, t.adminPanelTitle)
      ),
      h('nav', { className: 'flex-1 p-4 space-y-2' }, 
        menuItems.filter(item => item.roles.includes(user.role)).map(item => 
          h('button', {
            key: item.id,
            onClick: () => setActiveSection(item.id),
            className: `w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeSection === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-blue-50'}`
          },
            h(item.icon, { size: 20, key: 'icon' }),
            item.label
          )
        )
      ),
      h('button', {
        onClick: onClose,
        className: 'm-4 p-3 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100'
      }, h(X, { size: 20 }), t.back)
    );
  };

  const renderSubjects = () => {
    const filtered = tests.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const canEdit = ['main_admin', 'admin', 'zavuch'].includes(user.role);

    return h('div', { className: 'p-8' },
      h('div', { className: 'flex items-center justify-between mb-8' },
        h('div', { className: 'relative w-96' },
          h(Search, { className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400', size: 18 }),
          h('input', {
            placeholder: t.searchSubjects,
            className: 'w-full pl-10 pr-4 py-2 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value)
          })
        ),
        canEdit && h('button', {
          onClick: () => setShowAddModal(true),
          className: 'bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200'
        }, h(Plus, { size: 20 }), t.addSubject)
      ),
      h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' }, 
        filtered.map(test => 
          h('div', { key: test.id, className: 'bg-white p-4 rounded-2xl shadow-sm border border-blue-50' },
            h('img', { src: test.image_url || 'https://picsum.photos/seed/test/400/200', className: 'w-full h-32 object-cover rounded-xl mb-4' }),
            h('h3', { className: 'font-bold text-gray-800 mb-1' }, test.title),
            h('p', { className: 'text-xs text-gray-500 mb-4' }, test.description),
            h('div', { className: 'flex items-center justify-between' },
              h('span', { className: `text-[10px] font-bold px-2 py-1 rounded-full ${test.is_published ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}` }, test.is_published ? t.published : t.draft),
              h('div', { className: 'flex gap-2' },
                canEdit && h('button', { onClick: () => { setFormData(test); setShowAddModal(true); }, className: 'p-2 text-blue-600 hover:bg-blue-50 rounded-lg' }, h(Edit, { size: 18 })),
                canEdit && h('button', { onClick: () => deleteTest(test.id), className: 'p-2 text-red-600 hover:bg-red-50 rounded-lg' }, h(Trash2, { size: 18 }))
              )
            )
          )
        )
      )
    );
  };

  const renderAnalytics = () => {
    const data = [
      { name: '24с', users: 12, scores: 85 },
      { name: '48с', users: 19, scores: 78 },
      { name: '72с', users: 32, scores: 92 },
      { name: '14р', users: 120, scores: 88 },
      { name: '28р', users: 240, scores: 84 }
    ];

    return h('div', { className: 'p-8' },
      h('h2', { className: 'text-2xl font-black text-gray-800 mb-8' }, t.analytics),
      h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-8' },
        h('div', { className: 'bg-white p-6 rounded-3xl shadow-sm border border-blue-50' },
          h('h3', { className: 'font-bold text-gray-600 mb-6' }, t.studentInfo),
          h('div', { className: 'h-64' }, 
            h(ResponsiveContainer, { width: '100%', height: '100%' }, 
              h(LineChart, { data },
                h(CartesianGrid, { strokeDasharray: '3 3', vertical: false }),
                h(XAxis, { dataKey: 'name' }),
                h(YAxis),
                h(Tooltip),
                h(Line, { type: 'monotone', dataKey: 'users', stroke: '#2563eb', strokeWidth: 3, dot: { r: 6 } })
              )
            )
          )
        ),
        h('div', { className: 'bg-white p-6 rounded-3xl shadow-sm border border-blue-50' },
          h('h3', { className: 'font-bold text-gray-600 mb-6' }, 'Миёнаи балҳо'),
          h('div', { className: 'h-64' }, 
            h(ResponsiveContainer, { width: '100%', height: '100%' }, 
              h(BarChart, { data },
                h(CartesianGrid, { strokeDasharray: '3 3', vertical: false }),
                h(XAxis, { dataKey: 'name' }),
                h(YAxis),
                h(Tooltip),
                h(Bar, { dataKey: 'scores', fill: '#3b82f6', radius: [4, 4, 0, 0] })
              )
            )
          )
        )
      )
    );
  };

  const renderStudents = () => {
    return h('div', { className: 'p-8' },
      h('div', { className: 'bg-white rounded-3xl shadow-sm border border-blue-50 overflow-hidden' },
        h('table', { className: 'w-full text-left' },
          h('thead', { className: 'bg-blue-50' },
            h('tr', {},
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.name),
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.class),
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.phone),
              h('th', { className: 'p-4 font-bold text-blue-900' }, 'Вуруд'),
              h('th', { className: 'p-4 font-bold text-blue-900' }, 'Охирин вуруд')
            )
          ),
          h('tbody', {}, students.map(s => 
            h('tr', { key: s.id, className: 'border-b border-blue-50 hover:bg-blue-50/30' },
              h('td', { className: 'p-4 font-medium' }, s.full_name),
              h('td', { className: 'p-4' }, s.student_class),
              h('td', { className: 'p-4' }, s.phone),
              h('td', { className: 'p-4' }, s.login_count),
              h('td', { className: 'p-4 text-gray-400 text-xs' }, s.last_login ? new Date(s.last_login).toLocaleString() : '-')
            )
          ))
        )
      )
    );
  };

  const renderAddModal = () => {
    if (!showAddModal) return null;

    return h('div', { className: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' },
      h('div', { className: 'bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8' },
        h('div', { className: 'flex items-center justify-between mb-8' },
          h('h2', { className: 'text-2xl font-black text-blue-900' }, t.addSubject),
          h('button', { onClick: () => setShowAddModal(false) }, h(X, { size: 24 }))
        ),
        h('div', { className: 'grid grid-cols-2 gap-6 mb-8' },
          h('div', { key: 'title' },
            h('label', { className: 'block text-sm font-bold mb-1' }, t.testName),
            h('input', { 
              className: 'w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500',
              value: formData.title,
              onChange: (e) => setFormData({ ...formData, title: e.target.value })
            })
          ),
          h('div', { key: 'category' },
            h('label', { className: 'block text-sm font-bold mb-1' }, t.category),
            h('input', { 
              className: 'w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500',
              value: formData.category,
              onChange: (e) => setFormData({ ...formData, category: e.target.value })
            })
          ),
          h('div', { className: 'col-span-2', key: 'desc' },
            h('label', { className: 'block text-sm font-bold mb-1' }, t.description),
            h('textarea', { 
              className: 'w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500',
              value: formData.description,
              onChange: (e) => setFormData({ ...formData, description: e.target.value })
            })
          ),
          h('div', { key: 'duration' },
            h('label', { className: 'block text-sm font-bold mb-1' }, t.timeMinutes),
            h('input', { 
              type: 'number',
              className: 'w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500',
              value: formData.duration_minutes,
              onChange: (e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
            })
          ),
          h('div', { key: 'image' },
            h('label', { className: 'block text-sm font-bold mb-1' }, t.imageUrl),
            h('input', { 
              className: 'w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500',
              value: formData.image_url,
              onChange: (e) => setFormData({ ...formData, image_url: e.target.value })
            })
          )
        ),
        h('div', { className: 'space-y-6 mb-8' },
          h('h3', { className: 'text-lg font-bold text-gray-800' }, t.questions),
          formData.questions.map((q, idx) => 
            h('div', { key: idx, className: 'p-6 bg-blue-50 rounded-2xl space-y-4' },
              h('div', { className: 'flex items-center justify-between' },
                h('span', { className: 'font-bold text-blue-600' }, `${t.questionText} ${idx + 1}`),
                h('button', { 
                  onClick: () => {
                    const qs = [...formData.questions];
                    qs.splice(idx, 1);
                    setFormData({ ...formData, questions: qs });
                  },
                  className: 'text-red-500' 
                }, h(Trash2, { size: 18 }))
              ),
              h('input', { 
                placeholder: t.questionText,
                className: 'w-full p-3 rounded-xl border border-blue-100 outline-none',
                value: q.q,
                onChange: (e) => {
                  const qs = [...formData.questions];
                  qs[idx].q = e.target.value;
                  setFormData({ ...formData, questions: qs });
                }
              }),
              h('div', { className: 'grid grid-cols-2 gap-4' }, 
                ['a', 'b', 'c', 'd'].map(opt => 
                  h('div', { key: opt, className: 'flex items-center gap-2' },
                    h('input', { 
                      type: 'radio', 
                      name: `correct-${idx}`, 
                      checked: q.correct === opt,
                      onChange: () => {
                        const qs = [...formData.questions];
                        qs[idx].correct = opt;
                        setFormData({ ...formData, questions: qs });
                      }
                    }),
                    h('input', { 
                      placeholder: `${t.option} ${opt.toUpperCase()}`,
                      className: `flex-1 p-2 rounded-lg border outline-none ${q.correct === opt ? 'border-green-500 bg-green-50' : 'border-blue-100'}`,
                      value: q[opt],
                      onChange: (e) => {
                        const qs = [...formData.questions];
                        qs[idx][opt] = e.target.value;
                        setFormData({ ...formData, questions: qs });
                      }
                    })
                  )
                )
              )
            )
          ),
          h('button', {
            onClick: () => setFormData({ ...formData, questions: [...formData.questions, { q: '', a: '', b: '', c: '', d: '', correct: 'a' }] }),
            className: 'w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl text-blue-500 font-bold hover:bg-blue-50'
          }, t.addQuestion)
        ),
        h('div', { className: 'flex gap-4' },
          h('button', {
            onClick: handleSaveTest,
            className: 'flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700'
          }, t.save),
          h('button', {
            className: 'px-8 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200'
          }, t.preview)
        )
      )
    );
  };

  const renderResults = () => {
    const filtered = results.filter(r => 
      r.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tests?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return h('div', { className: 'p-8' },
      h('div', { className: 'flex items-center justify-between mb-8' },
        h('h2', { className: 'text-2xl font-black text-gray-800' }, t.searchResults),
        h('div', { className: 'relative w-96' },
          h(Search, { className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400', size: 18 }),
          h('input', {
            placeholder: t.searchResults,
            className: 'w-full pl-10 pr-4 py-2 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value)
          })
        )
      ),
      h('div', { className: 'bg-white rounded-3xl shadow-sm border border-blue-50 overflow-hidden' },
        h('table', { className: 'w-full text-left' },
          h('thead', { className: 'bg-blue-50' },
            h('tr', {},
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.studentName),
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.class),
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.subjects),
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.score),
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.date)
            )
          ),
          h('tbody', {}, filtered.map(r => 
            h('tr', { key: r.id, className: 'border-b border-blue-50 hover:bg-blue-50/30' },
              h('td', { className: 'p-4 font-medium' }, r.users?.full_name),
              h('td', { className: 'p-4' }, r.users?.student_class),
              h('td', { className: 'p-4' }, r.tests?.title),
              h('td', { className: 'p-4' },
                h('span', { className: 'font-black text-blue-600', key: 'score' }, `${r.score}/${r.total_questions}`),
                h('span', { className: 'ml-2 text-xs text-gray-400', key: 'percent' }, `(${Math.round((r.score/r.total_questions)*100)}%)`)
              ),
              h('td', { className: 'p-4 text-gray-400 text-xs' }, new Date(r.created_at).toLocaleString())
            )
          ))
        )
      )
    );
  };

  const renderLibrary = () => {
    return h('div', { className: 'p-8' },
      h('div', { className: 'flex items-center justify-between mb-8' },
        h('h2', { className: 'text-2xl font-black text-gray-800' }, t.library),
        h('button', {
          onClick: () => {
            setBookFormData({ title: '', file_url: '', student_class: '' });
            setShowBookModal(true);
          },
          className: 'bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200'
        }, h(Plus, { size: 20 }), t.addBook)
      ),
      h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' }, 
        library.map(book => 
          h('div', { key: book.id, className: 'bg-white p-4 rounded-2xl shadow-sm border border-blue-50 flex flex-col' },
            h('div', { className: 'h-32 bg-blue-50 rounded-xl flex items-center justify-center text-blue-300 mb-4', key: 'icon' }, h(Library, { size: 48 })),
            h('h4', { className: 'font-bold text-gray-800 mb-1 line-clamp-2', key: 'title' }, book.title),
            h('p', { className: 'text-xs text-gray-400 mb-4', key: 'class' }, `${book.student_class} ${t.class}`),
            h('div', { className: 'mt-auto flex gap-2', key: 'actions' },
              h('button', { 
                onClick: () => {
                  setBookFormData(book);
                  setShowBookModal(true);
                },
                className: 'p-2 text-blue-600 hover:bg-blue-50 rounded-lg'
              }, h(Edit, { size: 18 })),
              h('a', { href: book.file_url, target: '_blank', className: 'flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-center text-xs font-bold' }, t.read),
              h('button', { 
                onClick: async () => {
                  await supabase.from('library').delete().eq('id', book.id);
                  fetchData();
                },
                className: 'p-2 text-red-600 hover:bg-red-50 rounded-lg' 
              }, h(Trash2, { size: 18 }))
            )
          )
        )
      )
    );
  };

  const renderBookModal = () => {
    if (!showBookModal) return null;

    return h('div', { className: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' },
      h('div', { className: 'bg-white w-full max-w-md rounded-3xl shadow-2xl p-8' },
        h('div', { className: 'flex items-center justify-between mb-8' },
          h('h2', { className: 'text-2xl font-black text-blue-900' }, bookFormData.id ? t.editBook : t.addBook),
          h('button', { onClick: () => setShowBookModal(false) }, h(X, { size: 24 }))
        ),
        h('div', { className: 'space-y-4 mb-8' },
          h('div', { key: 'title' },
            h('label', { className: 'block text-sm font-bold mb-1' }, t.bookName),
            h('input', { 
              className: 'w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500',
              value: bookFormData.title,
              onChange: (e) => setBookFormData({ ...bookFormData, title: e.target.value })
            })
          ),
          h('div', { key: 'file' },
            h('label', { className: 'block text-sm font-bold mb-1' }, t.uploadFile),
            h('div', { className: 'relative' },
              h('input', {
                type: 'file',
                onChange: handleFileUpload,
                className: 'hidden',
                id: 'book-file-upload'
              }),
              h('label', {
                htmlFor: 'book-file-upload',
                className: `w-full p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${uploading ? 'bg-gray-50 border-gray-200' : 'border-blue-200 hover:bg-blue-50'}`
              },
                uploading ? h(Loader2, { className: 'animate-spin text-blue-600' }) : h(Upload, { className: 'text-blue-600' }),
                h('span', { className: 'text-xs font-bold text-gray-500' }, uploading ? t.loading : t.uploadFile)
              )
            ),
            uploadError && h('p', { className: 'mt-2 text-[10px] text-red-500 font-bold' }, uploadError),
            bookFormData.file_url && h('p', { className: 'mt-2 text-[10px] text-green-600 font-bold truncate' }, `✓ ${bookFormData.file_url}`)
          ),
          h('div', { key: 'class' },
            h('label', { className: 'block text-sm font-bold mb-1' }, t.class),
            h('input', { 
              className: 'w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500',
              value: bookFormData.student_class,
              onChange: (e) => setBookFormData({ ...bookFormData, student_class: e.target.value })
            })
          )
        ),
        bookSuccess && h('p', { className: 'text-green-500 text-sm font-bold mb-4 text-center' }, 'Китоб бомуваффақият илова шуд!'),
        h('button', {
          onClick: handleSaveBook,
          disabled: uploading || bookSuccess,
          className: `w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${uploading || bookSuccess ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'}`
        }, t.save)
      )
    );
  };

  const renderSettings = () => {
    const roles = [
      { id: 'student', label: 'Хонанда' },
      { id: 'rukovoditel', label: 'Руководитель' },
      { id: 'zavuch', label: 'Завуч' },
      { id: 'admin', label: 'Администратор' },
      { id: 'main_admin', label: 'Главный Админ' }
    ];

    return h('div', { className: 'p-8' },
      h('h2', { className: 'text-2xl font-black text-gray-800 mb-8' }, t.changeRole),
      h('div', { className: 'bg-white rounded-3xl shadow-sm border border-blue-50 overflow-hidden' },
        h('table', { className: 'w-full text-left' },
          h('thead', { className: 'bg-blue-50' },
            h('tr', {},
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.name),
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.status),
              h('th', { className: 'p-4 font-bold text-blue-900' }, t.changeRole)
            )
          ),
          h('tbody', {}, students.map(s => 
            h('tr', { key: s.id, className: 'border-b border-blue-50' },
              h('td', { className: 'p-4 font-medium' }, s.full_name),
              h('td', { className: 'p-4' },
                h('span', { className: 'px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase' }, s.role)
              ),
              h('td', { className: 'p-4' },
                h('select', {
                  className: 'p-2 rounded-lg border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-500',
                  value: s.role,
                  onChange: async (e) => {
                    const newRole = e.target.value;
                    await supabase.from('users').update({ role: newRole }).eq('id', s.id);
                    fetchData();
                  }
                }, roles.map(r => h('option', { key: r.id, value: r.id }, r.label)))
              )
            )
          ))
        )
      )
    );
  };

  const renderContent = () => {
    if (loading) return h('div', { className: 'flex-1 flex items-center justify-center' }, t.loading);
    
    switch (activeSection) {
      case 'subjects': return renderSubjects();
      case 'results': return renderResults();
      case 'analytics': return renderAnalytics();
      case 'students': return renderStudents();
      case 'library': return renderLibrary();
      case 'settings': return renderSettings();
      default: return h('div', { className: 'p-8' }, `Бахши ${activeSection} дар ҳоли сохтмон аст.`);
    }
  };

  return h('div', { className: 'fixed inset-0 bg-gray-50 z-[100] flex' },
    renderSidebar(),
    h('div', { className: 'flex-1 overflow-y-auto' },
      renderContent(),
      renderAddModal(),
      renderBookModal()
    )
  );
}
