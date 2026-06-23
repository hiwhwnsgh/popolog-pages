# popolog-pages

PopoLog 앱의 약관·정책 정적 페이지. Cloudflare Pages 로 호스팅.

## 구조

```
.
├── index.html              # 랜딩 (정책 페이지 진입점)
├── guide.html              # 사용 가이드 (1분 시작 가이드, 7단계)
├── privacy.html            # 개인정보처리방침
├── terms.html              # 서비스 이용약관
├── notices/index.html      # 공지사항 목록 (빌드 타임에 DB에서 생성)
├── style.css               # 공용 스타일
├── scripts/
│   └── build-notices.mjs   # 공지 목록 생성기
└── package.json
```

약관·정책은 빌드 불필요 — `.html` 의 `<main>` 안 텍스트를 직접 편집하면 됩니다.
**공지사항 목록만** 배포 직전 빌드 스텝에서 DB 내용으로 생성합니다(아래 참고).

## 공지사항 목록 빌드

`notices/index.html` 의 목록은 Supabase `notices` 테이블에서 생성합니다. notices RLS 가
`to authenticated` 라 공개 페이지에서 직접 못 읽으므로, **배포 직전** `build-notices.mjs`
가 `service_role` 키로 DB 를 읽어 정적 HTML 의 `<!-- notices:start -->` ~ `<!-- notices:end -->`
구간을 채웁니다. 노출 규칙은 RLS 와 동일(`is_active = true AND published_at <= now()`,
핀 우선·게시일 내림차순).

```bash
# 1) 환경변수 준비 (최초 1회)
cp .dev.vars.example .dev.vars
#   → .dev.vars 의 SUPABASE_SERVICE_ROLE_KEY 채우기
#   (Supabase 대시보드 → Project Settings → API → service_role secret)

# 2) 목록 생성
npm run build
```

- `.dev.vars` 는 git/배포 산출물에서 제외됩니다. service_role 키는 **절대 커밋·노출 금지**.
- 환경변수가 없으면 생성을 건너뛰고 기존(fallback) 목록이 그대로 남습니다 (CSS 만 고칠 때 안전).
- 공지를 새로 올리면(대시보드) **재배포해야 웹 목록에 반영**됩니다. 앱은 별개로 실시간 조회.

## 로컬 미리보기

```bash
npm run preview   # = python3 -m http.server 8000 → http://localhost:8000
```

## 배포

`wrangler` 로 배포합니다. 공지 목록 생성(빌드) → 업로드를 한 번에:

```bash
npm run deploy   # = npm run build && wrangler deploy
```

- `npm run deploy` 는 로컬에 `.dev.vars`(service_role 키)가 있어야 공지를 최신으로 생성합니다.
- 업로드 제외 파일은 `.assetsignore` 참고 (`scripts/`, `package.json`, `.dev.vars*` 등은 산출물에서 제외).

> Git 연동 Cloudflare Pages 를 쓸 경우: 빌드 설정의 **Build command** 를 `npm run build`,
> **Output directory** 를 `/` 로 두고, 프로젝트 환경변수에 `SUPABASE_URL` /
> `SUPABASE_SERVICE_ROLE_KEY` 를 등록하면 push 마다 자동으로 목록이 갱신됩니다.

## URL 매핑

Cloudflare Pages 가 `.html` 확장자를 자동으로 떼서 다음과 같이 서빙합니다.

| 경로 | 파일 |
|---|---|
| `/` | `index.html` |
| `/guide` | `guide.html` |
| `/privacy` | `privacy.html` |
| `/terms` | `terms.html` |

앱에서는 `/privacy`, `/terms` 경로를 WebView 로 띄우면 됩니다.

## 커스텀 도메인 연결 (나중에)

1. Cloudflare Pages 프로젝트 → **Custom domains** → **Set up a custom domain**
2. 도메인 입력 (예: `popolog.co.kr`)
3. Cloudflare 가 DNS 자동 설정 (도메인이 Cloudflare 에 등록된 경우)
4. 외부 등록업체(가비아 등) 도메인이면:
   - 가비아 도메인 콘솔 → 네임서버를 Cloudflare 가 안내하는 2개로 변경
   - 또는 가비아 DNS 그대로 두고 CNAME 만 추가 (안내된 값)
5. SSL 인증서 자동 발급 (수 분)

기존 `.pages.dev` 도 같이 살아 있으므로, 앱 구버전 호환 걱정 없이 점진적으로 갈아끼울 수 있음.

## 약관 본문 작성 가이드

각 페이지의 `<!-- TODO: ... -->` 주석을 찾아 채우세요.

- **개인정보처리방침**: 시행일, 책임자 정보, 위탁업체 등이 가장 자주 변경됨
- **이용약관**: 시행일·개정일만 잘 갱신하면 본문은 상대적으로 안정적

큰 변경 시에는 시행일·개정일을 갱신하고, 앱 내 공지사항에 변경 안내 한 줄을 띄우는 흐름을
권장합니다.
