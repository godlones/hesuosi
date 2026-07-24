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
1. GitHub → Settings → Developer settings → OAuth Apps → 你已有的 `hesuosi-cms` → **Update application**。
2. 检查并修改：
   - Homepage URL：`https://whyhe.top`
   - **Authorization callback URL**：必须是 `https://whyhe.top/callback`（不是 `/admin/`）
3. 保存后复制 **Client ID**（已经给过助手）。
4. 点击 **Generate a new client secret**，复制这个 **Client secret**（下一步要填到 Cloudflare，不要发在聊天里）。

> 如果你还没创建 OAuth App：New OAuth App → Homepage URL `https://whyhe.top` → Authorization callback URL `https://whyhe.top/callback` → Register。

**③ 填配置（OAuth App 的 Client ID）**
- `repo` 已填好：`godlones/hesuosi`（无需改）。
- `application_id` 已填入你给的 Client ID，已推送。
- OAuth 代理代码已放在 `functions/auth.js` 和 `functions/callback.js`，会随 Pages 一起部署。

**④ 把 Cloudflare Pages 接到 Git（需在你的 Cloudflare 账号点授权）**

⚠️ 重要：你现在的 `hesuosi` Pages 项目是 **wrangler 直传** 创建的，Cloudflare 不允许把直传项目切换成 Git 模式。所以必须**新建**一个 Git 驱动的项目，不能复用旧的 `hesuosi`。

1. Cloudflare 控制台 → Pages → 找到旧的 `hesuosi`（直传项目）→ **Delete** 删除它（自定义域 `whyhe.top` 会随项目一起解绑，没关系，下一步会重新绑）。
2. 点 **Create a project** → 选 **Connect to Git** → 授权 Cloudflare 读取你的 GitHub → 选仓库 **`godlones/hesuosi`**。
3. 构建设置：
   - Framework preset：**None**
   - Build command：`npm run build`
   - Build output directory：`dist`
4. 点 **Save and Deploy**，等首次构建完成（约 1 分钟）。
5. 进入该项目的 **Custom domains** → 添加 `whyhe.top` → 按提示确认（CNAME 已存在会自动复用，开橙云即可），几分钟后 `https://whyhe.top` 显示博客。
6. **设置环境变量**（OAuth 代理需要用 Client Secret 去 GitHub 换 token）：
   - 进入 Pages 项目 → **Settings** → **Variables and Secrets** → **+ Add**
   - 类型选 **Secret**
   - Name：`GITHUB_CLIENT_SECRET`
   - Value：你刚才从 GitHub OAuth App 复制的 **Client secret**
   - 保存后会触发重新部署。
7. 之后每次在 `/admin` 发布文章 → 提交 GitHub → Pages 自动重建。

## 写文章 / 发布

1. 打开 `https://whyhe.top/admin/`，用 GitHub 登录。
2. 点「文章 → New」，填标题 / 日期 / 分类，正文用 Markdown。
3. 点「Publish / Save」→ Decap 把 `.md` 提交到 GitHub → Pages 自动重建 → 几秒后前台出现新文章。
4. `publish_mode: editorial_workflow` 开启时，保存的是草稿，需再到「Workflow」里 Publish。
   想「保存即发布」就删掉 `config.yml` 里的那一行。

## 备注

- 之前用 `wrangler pages deploy` 的直接上传方式已废弃，改为 Git 驱动。
- Cloudflare API Token 仅部署时用过，请确保其未泄露；如怀疑泄露，去控制台撤销重发。
