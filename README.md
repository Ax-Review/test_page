# AX 위원회 평가 시스템

## 설치 방법

```bash
npm install
```

## Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. 프로젝트 설정에서 URL과 Anon Key 복사
3. `.env` 파일 생성 (프로젝트 루트에)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Supabase 대시보드의 SQL Editor에서 `supabase-schema.sql` 파일의 내용 실행

## 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속할 수 있습니다.

## 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 빌드 결과 미리보기

```bash
npm run preview
```

## GitHub Pages 배포

### 1. GitHub 저장소 생성 및 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```

### 2. GitHub 저장소 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. Source를 **GitHub Actions**로 선택

### 3. GitHub Secrets 설정

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. 다음 두 개의 Secret 추가:
   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key

### 4. vite.config.js 수정

`vite.config.js`의 `base` 값을 GitHub 저장소 이름에 맞게 수정하세요:

```js
base: '/your-repo-name/', // 저장소 이름으로 변경
```

### 5. 자동 배포

`main` 브랜치에 푸시하면 자동으로 빌드되고 GitHub Pages에 배포됩니다.

## 프로젝트 구조

- `ax-review-system.jsx` - 메인 React 컴포넌트
- `main.jsx` - React 앱 진입점
- `supabase.js` - Supabase 클라이언트 설정
- `index.html` - HTML 템플릿
- `vite.config.js` - Vite 빌드 설정
- `package.json` - 프로젝트 의존성 및 스크립트
- `supabase-schema.sql` - 데이터베이스 스키마
- `.github/workflows/deploy.yml` - GitHub Actions 배포 워크플로우

## 데이터 저장

이제 데이터는 Supabase PostgreSQL 데이터베이스에 저장됩니다:
- `projects` 테이블: 과제 목록
- `submissions` 테이블: 평가 제출 내역
