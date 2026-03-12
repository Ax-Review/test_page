-- Supabase 데이터베이스 스키마
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dept TEXT,
  eval_type TEXT NOT NULL CHECK (eval_type IN ('selfDev', 'external')),
  "desc" TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 평가 제출 테이블
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scores JSONB NOT NULL,
  total INTEGER NOT NULL,
  comment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_submissions_project_id ON submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- RLS (Row Level Security) 정책 설정
-- 모든 사용자가 읽기/쓰기 가능하도록 설정 (필요에 따라 수정 가능)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Allow public read access" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON submissions
  FOR SELECT USING (true);

-- 모든 사용자가 쓰기 가능
CREATE POLICY "Allow public insert" ON projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert" ON submissions
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 업데이트 가능
CREATE POLICY "Allow public update" ON projects
  FOR UPDATE USING (true);

CREATE POLICY "Allow public update" ON submissions
  FOR UPDATE USING (true);

-- 모든 사용자가 삭제 가능
CREATE POLICY "Allow public delete" ON projects
  FOR DELETE USING (true);

CREATE POLICY "Allow public delete" ON submissions
  FOR DELETE USING (true);
