// Decap CMS GitHub OAuth 代理：/callback
// GitHub 授权完成后跳转到这里，用 code 换 token，再 postMessage 回 Decap
// 当前为诊断版：显示 opener/origin 状态，便于定位"弹窗成功但主窗口不更新"的问题

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }

  const clientId = 'Ov23li1lyopAAG2Xgy7Y';
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientSecret) {
    return new Response(
      'OAuth not fully configured: missing GITHUB_CLIENT_SECRET environment variable.',
      { status: 500 }
    );
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return new Response(
      `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`,
      { status: 400 }
    );
  }

  const token = tokenData.access_token;
  const payload = JSON.stringify({ token });
  const msg = 'authorization:github:success:' + payload;

  // 诊断 + 发送：尝试多个目标，并在页面展示结果
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OAuth 诊断</title>
  <style>body{font-family:monospace;padding:24px;line-height:1.6}pre{background:#f4f4f4;padding:12px;border-radius:6px}button{margin-top:12px;padding:8px 16px}</style>
</head>
<body>
  <h3>GitHub 授权已成功，正在把 token 交回 Decap……</h3>
  <pre id="log"></pre>
  <p>若下方显示「已发给 opener / parent」但主窗口「何所思」后台仍未进入编辑器，说明是 Decap 的 origin 比对未通过（尾部斜杠问题）。</p>
  <button onclick="window.close()">关闭窗口</button>
  <script>
    (function() {
      var log = [];
      var msg = ${JSON.stringify(msg)};
      log.push('location.origin = ' + location.origin);
      log.push('window.opener 是否存在 = ' + (!!window.opener));
      log.push('window.parent !== self = ' + (window.parent !== window.self));
      try {
        if (window.opener) { window.opener.postMessage(msg, '*'); log.push('✓ 已发给 window.opener'); }
      } catch (e) { log.push('✗ opener 发送失败: ' + e.message); }
      try {
        if (window.parent && window.parent !== window.self) { window.parent.postMessage(msg, '*'); log.push('✓ 已发给 window.parent'); }
      } catch (e) { log.push('✗ parent 发送失败: ' + e.message); }
      if (!window.opener && !(window.parent && window.parent !== window.self)) {
        log.push('⚠ 既无 opener 也无 parent，消息无法送达主窗口');
      }
      document.getElementById('log').textContent = log.join('\\n');
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
