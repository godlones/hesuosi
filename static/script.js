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

// 时间轴滚动联动：随着页面滚动，高亮当前所在的日期节点
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.tl-item'));
  if (!items.length) return;
  function spy() {
    var threshold = window.innerHeight * 0.35;
    var current = null;
    for (var i = 0; i < items.length; i++) {
      var r = items[i].getBoundingClientRect();
      if (r.top <= threshold) current = items[i];
    }
    var visible = items.filter(function (it) {
      var b = it.getBoundingClientRect();
      return b.top <= threshold + 1 && b.bottom >= 0;
    });
    if (visible.length) current = visible[visible.length - 1];
    if (!current) current = items[0];
    items.forEach(function (it) { it.classList.remove('active'); });
    current.classList.add('active');
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(spy);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  spy();
})();
