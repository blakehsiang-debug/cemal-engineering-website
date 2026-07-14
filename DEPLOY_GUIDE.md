# Cemal Engineering — Cloudflare Pages 部署指南

## 部署方式（推荐方式 A：最简单）

### 方式 A：Cloudflare Dashboard 拖拽上传（无需代码）

1. **登录 Cloudflare Dashboard**
   - 打开 https://dash.cloudflare.com
   - 用邮箱 `blakehsiang@outlook.com` 登录

2. **创建 Pages 项目**
   - 左侧菜单点击 **"Workers & Pages"**
   - 点击 **"Create"** → 选择 **"Pages"**
   - 选择 **"Upload assets"**（直接上传文件夹）
   - 项目名称填写：`cemal-engineering`
   - 点击 **"Create project"**

3. **上传文件**
   - 拖拽 `deploy` 文件夹内的所有内容到上传区域（包括 `index.html`, `app.js`, `styles.css`, `assets/` 文件夹，`functions/` 文件夹，`robots.txt`, `sitemap.xml`, `_headers`）
   - 等待上传完成
   - 点击 **"Deploy site"**

4. **完成**
   - 网站会自动获得一个 `.pages.dev` 域名（如 `cemal-engineering.pages.dev`）
   - 测试表单提交，检查邮件是否收到

---

### 方式 B：Wrangler CLI 命令行部署（需要安装 Node.js）

```bash
# 1. 安装 Wrangler（只需一次）
npm install -g wrangler

# 2. 登录 Cloudflare（浏览器会弹出授权）
npx wrangler login

# 3. 进入部署目录
cd deploy

# 4. 部署（一键完成）
npx wrangler pages deploy .
```

---

## 绑定自定义域名

如果你想使用 `www.cemalengineering.com`：

1. 在 Cloudflare Dashboard 中，进入你的域名 `cemalengineering.com`
2. 点击 **"Workers & Pages"** → 选择你的 Pages 项目
3. 点击 **"Custom domains"** → **"Set up a custom domain"**
4. 输入 `www.cemalengineering.com` → 点击 **"Continue"** → **"Activate domain"**
5. 等待 DNS 生效（通常几分钟）

---

## 部署后需要检查的事项

| 检查项 | 方法 |
|---|---|
| 网站能正常打开 | 访问 `.pages.dev` 域名或自定义域名 |
| 表单能提交 | 填写并提交，检查是否显示绿色成功消息 |
| 邮件收到 | 检查 `sales@cemalengineering.com` 收件箱 |
| 附件包含 | 提交带文件的表单，检查邮件是否有附件 |
| Google Analytics 工作 | 在 GA 后台查看实时访客数据 |
| 移动端正常 | 用手机浏览器打开网站检查 |

---

## 文件说明

| 文件 | 作用 |
|---|---|
| `index.html` | 主页面 |
| `app.js` | 动画和表单逻辑 |
| `styles.css` | 样式 |
| `assets/` | 图片、图标、视频 |
| `functions/api/submit.js` | 表单后端（Cloudflare Workers Function）|
| `robots.txt` | 告诉搜索引擎可以索引 |
| `sitemap.xml` | 站点地图，帮助SEO |
| `_headers` | 安全头部（CSP、防点击劫持等）|
| `wrangler.toml` | Wrangler CLI 配置文件 |

---

## 常见问题

**Q: 部署后表单提交不了？**
A: 检查 `functions/api/submit.js` 是否正确上传。在 Pages 设置中查看 Functions 日志。

**Q: 邮件没有收到？**
A: Resend API 密钥已嵌入代码中。检查 Resend 后台（https://resend.com）的邮件发送记录。

**Q: 如何更新网站？**
A: 修改文件后重新执行方式A或B的上传步骤。Cloudflare Pages 会自动部署新版本。

---

部署包位置：`C:\Users\Cemal-001\Documents\Kimi\Workspaces\Cemal新网站\deploy\`
