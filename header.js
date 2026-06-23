/* ───────────────────────────────────────────────────────────
   사이트 공통 상단바 동작 (Single Source of Truth)
   '더보기' 드롭다운은 <details>/<summary> 네이티브로 열고 닫는다.
   여기서는 UX 보강만: 바깥을 클릭하거나 Esc 를 누르면 닫는다.
   ─────────────────────────────────────────────────────────── */
(function () {
  var menu = document.querySelector(".site-header details.nav-more-d");
  if (!menu) return;

  // 메뉴 바깥 클릭 시 닫기
  document.addEventListener("click", function (e) {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });

  // Esc 로 닫고 요약 버튼으로 포커스 복귀
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.open) {
      menu.open = false;
      var summary = menu.querySelector("summary");
      if (summary) summary.focus();
    }
  });
})();
