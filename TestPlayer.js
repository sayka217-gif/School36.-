import React from 'react';
import { supabase } from '../supabase.js';
import { Timer, CheckCircle2, XCircle, Trophy, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const { useState, useEffect, createElement: h } = React;

export default function TestPlayer({ test, user, onComplete, t }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(test.duration_minutes * 60);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      finishTest();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const finishTest = async () => {
    let score = 0;
    test.questions.forEach((q, idx) => {
      if (answers[idx] === q.correct) score++;
    });

    const percentage = (score / test.questions.length) * 100;
    let grade = 2;
    if (percentage >= 90) grade = 5;
    else if (percentage >= 75) grade = 4;
    else if (percentage >= 50) grade = 3;

    const resData = {
      user_id: user.id,
      test_id: test.id,
      score,
      total_questions: test.questions.length,
      grade,
      time_spent_seconds: (test.duration_minutes * 60) - timeLeft
    };

    await supabase.from('results').insert([resData]);
    
    setResult(resData);
    setFinished(true);
  };

  if (finished) {
    return h('div', { className: 'min-h-screen bg-blue-50 flex items-center justify-center p-4' },
      h(motion.div, {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        className: 'bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center'
      },
        h(Trophy, { className: 'mx-auto text-yellow-500 mb-4', size: 64, key: 'icon' }),
        h('h2', { className: 'text-3xl font-black text-blue-900 mb-2', key: 'title' }, t.testFinished),
        h('p', { className: 'text-gray-500 mb-8', key: 'subtitle' }, t.resultSaved),
        h('div', { className: 'grid grid-cols-2 gap-4 mb-8', key: 'stats' },
          h('div', { className: 'bg-blue-50 p-6 rounded-2xl', key: 'score-card' },
            h('div', { className: 'text-4xl font-black text-blue-600 mb-1' }, `${result.score}/${result.total_questions}`),
            h('div', { className: 'text-[10px] font-bold text-blue-400 uppercase tracking-widest' }, t.score)
          ),
          h('div', { className: 'bg-green-50 p-6 rounded-2xl', key: 'grade-card' },
            h('div', { className: 'text-4xl font-black text-green-600 mb-1' }, result.grade),
            h('div', { className: 'text-[10px] font-bold text-green-400 uppercase tracking-widest' }, 'Баҳо')
          )
        ),
        h('button', {
          key: 'back-btn',
          onClick: onComplete,
          className: 'w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200'
        }, t.backToHome)
      )
    );
  }

  const q = test.questions[currentIdx];

  return h('div', { className: 'min-h-screen bg-gray-50' },
    h('header', { className: 'bg-white border-b p-4 sticky top-0 z-10 flex items-center justify-between', key: 'header' },
      h('div', { className: 'flex items-center gap-4', key: 'left' },
        h('button', { onClick: onComplete, className: 'p-2 hover:bg-gray-100 rounded-full' }, h(ArrowLeft, { size: 20 })),
        h('h1', { className: 'font-bold text-gray-800' }, test.title)
      ),
      h('div', { className: 'flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl text-blue-600 font-bold', key: 'timer' },
        h(Timer, { size: 18 }),
        `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
      )
    ),
    h('main', { className: 'max-w-2xl mx-auto p-4 pt-8', key: 'main' },
      h('div', { className: 'mb-8', key: 'progress' },
        h('div', { className: 'flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest' },
          h('span', { key: 'count' }, `${t.question} ${currentIdx + 1} ${t.of} ${test.questions.length}`),
          h('span', { key: 'percent' }, `${Math.round(((currentIdx + 1) / test.questions.length) * 100)}%`)
        ),
        h('div', { className: 'h-2 bg-gray-200 rounded-full overflow-hidden' },
          h('div', { className: 'h-full bg-blue-600 transition-all duration-300', style: { width: `${((currentIdx + 1) / test.questions.length) * 100}%` } })
        )
      ),
      h('div', { className: 'bg-white p-8 rounded-3xl shadow-sm border border-blue-50 mb-8', key: 'question-card' },
        h('h2', { className: 'text-xl font-bold text-gray-800 mb-8' }, q.q),
        h('div', { className: 'space-y-4' }, 
          ['a', 'b', 'c', 'd'].map(opt => 
            h('button', {
              key: opt,
              onClick: () => setAnswers({ ...answers, [currentIdx]: opt }),
              className: `w-full p-4 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between ${answers[currentIdx] === opt ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 hover:border-blue-200 text-gray-600'}`
            },
              h('span', { key: 'text' }, `${opt.toUpperCase()}) ${q[opt]}`),
              answers[currentIdx] === opt && h(CheckCircle2, { size: 20, key: 'check' })
            )
          )
        )
      ),
      h('div', { className: 'flex gap-4', key: 'nav' },
        h('button', {
          key: 'prev',
          disabled: currentIdx === 0,
          onClick: () => setCurrentIdx(prev => prev - 1),
          className: 'flex-1 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-500 disabled:opacity-50'
        }, t.previous),
        currentIdx === test.questions.length - 1 
          ? h('button', { key: 'finish', onClick: finishTest, className: 'flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200' }, t.finish)
          : h('button', { key: 'next', onClick: () => setCurrentIdx(prev => prev + 1), className: 'flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200' }, t.next)
      )
    )
  );
}
