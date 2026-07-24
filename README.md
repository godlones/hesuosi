# 何所思 · 博客（Cloudflare Pages + Decap CMS）

一个由 Cloudflare Pages 免费托管的静态博客，用 **Decap CMS** 提供浏览器后台：
登录 → 写 Markdown → 点发布，内容提交到 GitHub，Pages 自动重新构建上线。

## 目录结构

```
my-site/
├── content/posts/        # 文章源文件（Markdown + frontmatter），Decap 在这里读写
├── templates/            # 首页 / 文章页 HTML 模板（含 {{占位符}}）
├── static/               # 静态资源：styles.css、script.js、admin/（Decap 后台）
├── static/admin/         # Decap CMS：index.html + config.yml
├── build.js              # 构建脚本：Markdown → 静态 HTML
├── package.json          # 依赖与 build 命令
└── dist/                 # 构建产物（自动生成，勿手改；已被 .gitignore）
```

## 本地预览

```bash
npm install          # 安装 marked / gray-matter
npm run build        # 把 content/ 编译到 dist/
# 预览：用任意静态服务器打开 dist/，例如
python -m http.server 8000 --directory dist
```

## 接好 GitHub + Cloudflare（一次性，需在你的账号里操作）

构建流水线已经验证可用。下面几步必须在你的 GitHub / Cloudflare 账号里完成（我无法替你登录）：

**① 推到 GitHub**
1. 在 GitHub 新建一个仓库（如 `hesuosi`），公开或私有均可。
2. 把 `my-site/` 整个目录提交并推上去（`content/`、`templates/`、`static/`、`build.js`、`package.json`、`.gitignore`）。
   - 不要提交 `node_modules/`、`dist/`（已被 .gitignore）。

**② 注册 GitHub OAuth App（Decap 登录用）**
1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App。
2. Application name：随便（如 `hesuosi-cms`）。
3. Homepage URL：`https://whyhe.top`
4. Authorization callback URL：`https://whyhe.top/admin/`
5. 创建后复制 **Client ID**（不是 Client secret）。

**③ 填配置**
1. 打开 `static/admin/config.yml`，把：
   - `repo: YOUR_GITHUB_USERNAME/hesuosi` → 改成你的 `用户名/仓库名`
   - `application_id: YOUR_GITHUB_OAUTH_CLIENT_ID` → 改成刚复制的 Client ID
2. 提交并推送到 GitHub。

**④ 把 Cloudflare Pages 接到 Git**
1. Cloudflare 控制台 → Pages → 删除旧的 `hesuosi` 直接上传项目（或直接新建）。
2. 新建 Pages 项目 → 连接 Git 仓库 → 选 `hesuosi` 仓库。
3. 构建命令：`npm run build`；输出目录：`dist`；Framework preset：None。
4. 等首次构建完成，访问 `https://whyhe.top`（或你的自定义域）应能看到博客。
   - 若还没绑自定义域：在 Pages 设置里添加 `whyhe.top`（之前已绑过，状态 active 可复用）。

## 写文章 / 发布

1. 打开 `https://whyhe.top/admin/`，用 GitHub 登录。
2. 点「文章 → New」，填标题 / 日期 / 分类，正文用 Markdown。
3. 点「Publish / Save」→ Decap 把 `.md` 提交到 GitHub → Pages 自动重建 → 几秒后前台出现新文章。
4. `publish_mode: editorial_workflow` 开启时，保存的是草稿，需再到「Workflow」里 Publish。
   想「保存即发布」就删掉 `config.yml` 里的那一行。

## 备注

- 之前用 `wrangler pages deploy` 的直接上传方式已废弃，改为 Git 驱动。
- Cloudflare API Token 仅部署时用过，请确保其未泄露；如怀疑泄露，去控制台撤销重发。
