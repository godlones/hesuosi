// 页脚年份 + 文章页阅读进度条
(function () {
  var y = new Date().getFullYear();
  var el = document.getElementById('year');
  if (el) el.textContent = y;
  document.querySelectorAll('.yr').forEach(function (n) { n.textContent = y; });

  // 阅读进度条（仅文章页有意义，首页也有元素但几乎不影响）
  var bar = document.getElementById('progress');
  if (bar) {
    var update = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var top = doc.scrollTop || document.body.scrollTop || 0;
      var pct = max > 0 ? (top / max) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();
