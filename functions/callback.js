// Decap CMS GitHub OAuth 代理：/callback
// GitHub 授权完成后跳转到这里，用 code 换 token，再 postMessage 回 Decap

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

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>登录成功</title>
</head>
<body>
  <p>授权完成，正在关闭窗口……</p>
  <script>
    (function() {
      var msg = 'authorization:github:success:${payload.replace(/'/g, "\\'")}';
      if (window.opener) {
        window.opener.postMessage(msg, '*');
      }
      setTimeout(function() { window.close(); }, 800);
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
