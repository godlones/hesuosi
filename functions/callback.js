// Decap CMS GitHub 登录代理 —— /callback 回调
// GitHub 授权完成后带着 code 跳回这里：用 code 换取 access_token，
// 再把 token 通过 postMessage 交给还开着的主窗口(Decap)，完成登录。
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  const clientId = 'Ov23li1lyopAAG2Xgy7Y';
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!code) {
    return new Response('Missing code parameter from GitHub.', { status: 400 });
  }
  if (!clientSecret) {
    return new Response(
      'OAuth not fully configured: missing GITHUB_CLIENT_SECRET environment variable.',
      { status: 500 }
    );
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: 'https://whyhe.top/callback',
    }),
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return new Response(
      'Failed to obtain access token: ' + JSON.stringify(tokenData),
      { status: 500 }
    );
  }

  const html = `<!doctype html>
<html lang="zh">
<head><meta charset="utf-8"><title>授权完成</title></head>
<body>
<script>
  var payload = JSON.stringify({ token: ${JSON.stringify(accessToken)} });
  try {
    if (window.opener) {
      window.opener.postMessage('authorization:github:success:' + payload, window.opener.location.origin);
    }
  } catch (e) {}
  document.body.innerHTML = '授权完成，正在把 token 交回 Decap……<br>若窗口未自动关闭，请手动关闭。';
  setTimeout(function () { window.close(); }, 2000);
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
