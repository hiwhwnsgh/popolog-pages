// 공지사항 목록을 빌드 타임에 Supabase DB 에서 읽어 notices/index.html 에 주입한다.
//
// 왜 빌드 타임인가:
//   notices RLS 는 `to authenticated` 라 공개(anon) 정적 페이지에서는 직접 못 읽는다.
//   대신 배포 직전 이 스크립트가 service_role 키로 DB 를 읽어 정적 HTML 을 생성한다.
//   결과물은 순수 정적이라 빠르고 SEO 친화적이며, 키는 빌드 환경에만 있고 산출물에는 안 남는다.
//   (앱은 별개로 로그인 세션 + RLS 로 같은 테이블을 읽는다 — 두 경로가 공존.)
//
// 노출 규칙은 RLS 와 동일하게 맞춘다: is_active = true AND published_at <= now(),
// 정렬은 (is_pinned desc, published_at desc) — DB notices_list_idx 와 동일.
//
// 환경변수(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)가 없으면 경고만 남기고 건너뛴다.
// CSS 만 고치고 배포할 때 키 없이도 빌드가 깨지지 않게 하기 위함. 단 이 경우 목록은
// 마커 사이의 기존(fallback) 내용 그대로 나간다.

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = join(ROOT, "notices", "index.html");

const START = "<!-- notices:start — build-notices.mjs 가 빌드 시 DB에서 자동 생성. 직접 편집 금지 -->";
const END = "<!-- notices:end -->";

// DB notice_category enum ↔ 배지 클래스/라벨. 앱 NoticeCategory 와 동일 체계.
const CATEGORY = {
  service: { cls: "badge-service", label: "서비스" },
  update: { cls: "badge-update", label: "업데이트" },
  maintenance: { cls: "badge-maintenance", label: "점검" },
  event: { cls: "badge-event", label: "이벤트" },
};

const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(iso) {
  const parts = dateFmt.formatToParts(new Date(iso));
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rowHtml(notice) {
  const cat = CATEGORY[notice.category];
  if (!cat) throw new Error(`알 수 없는 category: ${notice.category} (id=${notice.id})`);
  const pin = notice.is_pinned
    ? '<span class="notice-pin" aria-hidden="true"></span>'
    : "";
  return `            <tr data-category="${cat.label}">
              <td><span class="notice-badge ${cat.cls}">${cat.label}</span></td>
              <td><a class="notice-title" href="${escapeHtml(notice.content_url)}">${pin}${escapeHtml(notice.title)}</a></td>
              <td>${formatDate(notice.published_at)}</td>
              <td><span class="notice-arrow" aria-hidden="true"></span></td>
            </tr>`;
}

const emptyRow = `            <tr>
              <td colspan="4" class="notice-empty">등록된 공지사항이 없습니다.</td>
            </tr>`;

async function fetchNotices(baseUrl, key) {
  const nowIso = new Date().toISOString();
  const query = new URLSearchParams({
    select: "id,title,content_url,category,is_pinned,published_at",
    is_active: "eq.true",
    published_at: `lte.${nowIso}`,
    order: "is_pinned.desc,published_at.desc",
  });
  const res = await fetch(`${baseUrl}/rest/v1/notices?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    throw new Error(`Supabase 조회 실패: ${res.status} ${res.statusText} — ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !key) {
    console.warn(
      "[build-notices] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정 → 공지 생성 건너뜀. " +
        "기존 목록이 그대로 배포됩니다.",
    );
    return;
  }

  const notices = await fetchNotices(baseUrl.replace(/\/$/, ""), key);
  const rows = notices.length ? notices.map(rowHtml).join("\n") : emptyRow;

  const html = await readFile(TARGET, "utf8");
  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`마커(${START} … ${END})를 ${TARGET} 에서 찾지 못했습니다.`);
  }

  const before = html.slice(0, startIdx + START.length);
  const after = html.slice(endIdx);
  const next = `${before}\n${rows}\n            ${after}`;

  await writeFile(TARGET, next, "utf8");
  console.log(`[build-notices] 공지 ${notices.length}건 생성 완료 → ${TARGET}`);
}

main().catch((err) => {
  console.error(`[build-notices] 실패: ${err.message}`);
  process.exit(1);
});
