# popolog-pages

PopoLog 앱의 약관·정책 정적 페이지. Cloudflare Pages 로 호스팅.

## 구조

```
.
├── index.html      # 랜딩 (정책 페이지 진입점)
├── privacy.html    # 개인정보처리방침
├── terms.html      # 서비스 이용약관
├── style.css       # 공용 스타일
└── README.md
```

빌드 스텝 없음 — HTML 파일을 그대로 서빙합니다. 약관 내용 수정은 해당 `.html` 의
`<main>` 안 텍스트를 직접 편집하면 됩니다.

## 로컬 미리보기

```bash
# 어떤 정적 서버든 OK
python3 -m http.server 8000
# → http://localhost:8000
```

## Cloudflare Pages 셋업 (최초 1회)

1. https://dash.cloudflare.com → 가입/로그인
2. 좌측 메뉴 **Workers & Pages** → **Create application** → **Pages** 탭 → **Connect to Git**
3. GitHub 인증 → 이 레포(`popolog-pages`) 선택
4. 빌드 설정:
   - Framework preset: **None**
   - Build command: 비워두기
   - Build output directory: `/` (또는 비워두기)
5. **Save and Deploy**
6. 수십 초 후 `https://popolog-pages.pages.dev` 같은 URL 발급
7. 메인 브랜치 push 마다 자동 재배포

## URL 매핑

Cloudflare Pages 가 `.html` 확장자를 자동으로 떼서 다음과 같이 서빙합니다.

| 경로 | 파일 |
|---|---|
| `/` | `index.html` |
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
