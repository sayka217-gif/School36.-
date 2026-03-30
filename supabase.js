import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tedmrksgweqtyjfbcbkp.supabase.co';
const supabaseKey = 'sb_publishable_xvuH9fMP56W6TnvKVEyrtg_2eoTzjx8';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * SQL Schema for Supabase (Run this in Supabase SQL Editor):
 * 
 * -- 1. Users Table
 * CREATE TABLE users (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   full_name TEXT NOT NULL,
 *   phone TEXT UNIQUE NOT NULL,
 *   password TEXT NOT NULL,
 *   student_class TEXT,
 *   role TEXT DEFAULT 'student', -- 'main_admin', 'admin', 'zavuch', 'rukovoditel', 'student'
 *   login_count INTEGER DEFAULT 0,
 *   last_login TIMESTAMP WITH TIME ZONE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 2. Subjects/Tests Table
 * CREATE TABLE tests (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   title TEXT NOT NULL,
 *   description TEXT,
 *   category TEXT,
 *   questions JSONB NOT NULL, -- Array of { q, a, b, c, d, correct }
 *   duration_minutes INTEGER DEFAULT 15,
 *   image_url TEXT,
 *   is_published BOOLEAN DEFAULT true,
 *   created_by UUID REFERENCES users(id),
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 3. Results Table
 * CREATE TABLE results (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   user_id UUID REFERENCES users(id),
 *   test_id UUID REFERENCES tests(id),
 *   score INTEGER NOT NULL,
 *   total_questions INTEGER NOT NULL,
 *   time_spent_seconds INTEGER,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 4. Library Table
 * CREATE TABLE library (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   title TEXT NOT NULL,
 *   student_class TEXT,
 *   file_url TEXT NOT NULL,
 *   file_type TEXT, -- 'pdf', 'word'
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 5. Initial Main Admin
 * INSERT INTO users (full_name, phone, password, role)
 * VALUES ('Мактаб', '930098404', '26170133', 'main_admin');
 * 
 * -- 6. Storage Bucket for Images and Documents
 * -- Create buckets named 'images' and 'documents' in Supabase Storage UI.
 * -- Enable public access or set RLS policies.
 */
