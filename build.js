/**
 * 构建脚本：把 content/posts 下的 Markdown 文章编译成静态 HTML 站点。
 * 运行：node build.js  ->  产物输出到 dist/
 * Cloudflare Pages 构建命令：npm run build，输出目录：dist
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content', 'posts');
const TEMPLATES = path.join(ROOT, 'templates');
const STATIC = path.join(ROOT, 'static');
const DIST = path.join(ROOT, 'dist');

// marked 配置：目录/表格等常用语法
marked.setOptions({ breaks: false, gfm: true });

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
function excerpt(html, n = 80) {
  const t = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}
function fmtDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(d).slice(0, 10);
}

// 1. 读取所有文章
const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith('.md'));
const posts = files.map((f) => {
  const raw = fs.readFileSync(path.join(CONTENT, f), 'utf8');
  const { data, content } = matter(raw);
  const slug = f.replace(/\.md$/, '');
  const html = marked.parse(content);
  return {
    slug,
    title: data.title || slug,
    date: fmtDate(data.date),
    category: data.category || '',
    html,
    excerpt: excerpt(html),
  };
});
// 按日期倒序（无日期排最后），同名按标题
posts.sort((a, b) => {
  if (b.date && a.date) return b.date.localeCompare(a.date);
  if (b.date) return 1;
  if (a.date) return -1;
  return a.title.localeCompare(b.title);
});

// 2. 准备 dist（直接覆盖，不删除目录，避免沙箱安全删除拦截）
fs.mkdirSync(DIST, { recursive: true });

// 3. 生成文章页
const postTpl = fs.readFileSync(path.join(TEMPLATES, 'post.html'), 'utf8');
for (const p of posts) {
  const html = postTpl
    .replace(/\{\{TITLE\}\}/g, p.title)
    .replace(/\{\{DATE\}\}/g, p.date)
    .replace(/\{\{CATEGORY\}\}/g, p.category)
    .replace(/\{\{BODY\}\}/g, p.html);
  const out = path.join(DIST, 'posts', p.slug + '.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

// 4. 生成首页（注入文章卡片）
let indexTpl = fs.readFileSync(path.join(TEMPLATES, 'index.html'), 'utf8');
const cards = posts
  .map(
    (p) => `      <article class="post">
        <div class="post-top">
          <span class="tag">${p.category}</span>
          <span class="post-date">${p.date}</span>
        </div>
        <h3 class="post-title"><a href="posts/${p.slug}.html">${p.title}</a></h3>
        <p class="post-excerpt">${p.excerpt}</p>
        <span class="read-more">阅读全文 →</span>
      </article>`
  )
  .join('\n');
indexTpl = indexTpl.replace('<!--POSTS-->', cards);

// 4b. 生成纵向时间轴（按年分组，倒序：最新在前）
const timeline = (() => {
  let curYear = '';
  let html = '';
  for (const p of posts) {
    const year = (p.date || '').slice(0, 4);
    if (year && year !== curYear) {
      curYear = year;
      html += `      <div class="tl-year">${year}</div>\n`;
    }
    html += `      <a class="tl-item" href="posts/${p.slug}.html">
        <span class="tl-dot"></span>
        <div class="tl-card">
          <div class="tl-date">${p.date}</div>
          <div class="tl-title">${p.title}</div>
          <div class="tl-excerpt">${p.excerpt}</div>
          <span class="tag">${p.category}</span>
        </div>
      </a>\n`;
  }
  return html;
})();
indexTpl = indexTpl.replace('<!--TIMELINE-->', timeline);

fs.writeFileSync(path.join(DIST, 'index.html'), indexTpl);

// 5. 复制静态资源（含 /admin 后台）
copyDir(STATIC, DIST);

// 6. 生成 RSS
const items = posts
  .map(
    (p) => `    <item>
      <title>${p.title}</title>
      <link>https://whyhe.top/posts/${p.slug}</link>
      <guid>https://whyhe.top/posts/${p.slug}</guid>
      <pubDate>${new Date(p.date || Date.now()).toUTCString()}</pubDate>
      <description>${p.excerpt}</description>
    </item>`
  )
  .join('\n');
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>何所思</title>
    <link>https://whyhe.top</link>
    <description>何所思——记录技术、阅读与思考的个人博客</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(DIST, 'feed.xml'), feed);

console.log(`构建完成：${posts.length} 篇文章 -> ${path.relative(ROOT, DIST)}/`);
