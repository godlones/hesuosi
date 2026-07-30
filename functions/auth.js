// Decap CMS GitHub 登录代理 —— /auth 入口
// 关键：Decap 的 GitHub 后端是"两段式握手"协议。
// 它打开本页面(弹窗)后，会先在 window.opener 上监听一条 "authorizing:github" 握手消息；
// 只有收到握手，才会切换监听器去等待 "authorization:github:success:..."。
// 因此本页面必须先 postMessage 握手，再跳转到 GitHub 授权页。
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || 'github';
  const siteId = url.searchParams.get('site_id') || '';

  const clientId = 'Ov23li1lyopAAG2Xgy7Y';
  const redirectUri = 'https://whyhe.top/callback';
  const githubUrl =
    'https://github.com/login/oauth/authorize' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&scope=' + encodeURIComponent('repo,user:email') +
    '&state=' + encodeURIComponent(siteId || 'hesuosi');

  const html = `<!doctype html>
<html lang="zh">
<head><meta charset="utf-8"><title>正在授权…</title></head>
<body>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage('authorizing:${provider}', window.opener.location.origin);
    }
  } catch (e) {}
  // 稍等确保握手消息已入队，再跳转 GitHub 授权页
  setTimeout(function () { window.location.href = ${JSON.stringify(githubUrl)}; }, 80);
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
