/* Top menu on the pages that don't load site.js (heatmap, terms, privacy, refund policy). */
(function () {
  var btn = document.getElementById("menu-btn"), panel = document.getElementById("menu"), nav = document.getElementById("nav");
  if (nav) { var s = function () { nav.classList.toggle("scrolled", window.scrollY > 10); }; addEventListener("scroll", s, { passive: true }); s(); }
  if (!btn || !panel) return;
  function set(open) {
    btn.setAttribute("aria-expanded", open);
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    panel.hidden = !open;
  }
  btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true"); });
  panel.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { set(false); btn.focus(); } });
  matchMedia("(min-width:901px)").addEventListener("change", function (e) { if (e.matches) set(false); });
})();
