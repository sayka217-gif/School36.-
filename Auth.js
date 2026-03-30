import React from 'react';
import { supabase } from '../supabase.js';

const { useState, createElement: h } = React;

export default function Auth({ onAuthSuccess, t }) {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login logic
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('phone', phone)
          .eq('password', password)
          .single();

        if (error || !data) throw new Error(t.authError);

        // Update login count
        await supabase
          .from('users')
          .update({ 
            login_count: (data.login_count || 0) + 1,
            last_login: new Date().toISOString()
          })
          .eq('id', data.id);

        localStorage.setItem('school_user', JSON.stringify(data));
        onAuthSuccess(data);
      } else {
        // Registration logic
        // Check if exists
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('phone', phone)
          .single();

        if (existing) {
          setIsLogin(true);
          setError(t.alreadyRegistered);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .insert([{ 
            full_name: fullName, 
            phone, 
            password, 
            student_class: studentClass,
            role: 'student'
          }])
          .select()
          .single();

        if (error) throw error;

        localStorage.setItem('school_user', JSON.stringify(data));
        onAuthSuccess(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return h('div', { className: 'min-h-screen flex items-center justify-center bg-blue-50 p-4' },
    h('div', { className: 'bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-blue-100' },
      h('div', { className: 'text-center mb-8' },
        h('h2', { className: 'text-3xl font-black text-blue-900 mb-2' }, isLogin ? t.login : t.register),
        h('p', { className: 'text-blue-400' }, 'School 36 St. Shohmansur')
      ),
      h('form', { onSubmit: handleAuth, className: 'space-y-4' },
        [
          !isLogin && h('div', { key: 'field-name' },
            h('label', { className: 'block text-sm font-bold text-gray-700 mb-1' }, t.fullName),
            h('input', {
              required: true,
              className: 'w-full p-3 rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none',
              value: fullName,
              onChange: (e) => setFullName(e.target.value)
            })
          ),
          h('div', { key: 'field-phone' },
            h('label', { className: 'block text-sm font-bold text-gray-700 mb-1' }, t.phone),
            h('input', {
              required: true,
              className: 'w-full p-3 rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none',
              value: phone,
              onChange: (e) => setPhone(e.target.value)
            })
          ),
          !isLogin && h('div', { key: 'field-class' },
            h('label', { className: 'block text-sm font-bold text-gray-700 mb-1' }, t.class),
            h('input', {
              required: true,
              className: 'w-full p-3 rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none',
              value: studentClass,
              onChange: (e) => setStudentClass(e.target.value)
            })
          ),
          h('div', { key: 'field-password' },
            h('label', { className: 'block text-sm font-bold text-gray-700 mb-1' }, t.password),
            h('input', {
              type: 'password',
              required: true,
              className: 'w-full p-3 rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none',
              value: password,
              onChange: (e) => setPassword(e.target.value)
            })
          ),
          error && h('p', { key: 'auth-error', className: 'text-red-500 text-xs font-bold' }, error),
          h('button', {
            key: 'submit-btn',
            type: 'submit',
            disabled: loading,
            className: 'w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200'
          }, loading ? t.executing : (isLogin ? t.login : t.register)),
          h('button', {
            key: 'toggle-btn',
            type: 'button',
            onClick: () => setIsLogin(!isLogin),
            className: 'w-full text-blue-600 text-sm font-bold mt-4'
          }, isLogin ? t.noAccount : t.haveAccount)
        ].filter(Boolean)
      )
    )
  );
}
