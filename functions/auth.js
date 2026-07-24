// Decap CMS GitHub OAuth 代理：/auth
// 被 Decap 调用，将用户重定向到 GitHub 授权页

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const clientId = 'Ov23li1lyopAAG2Xgy7Y';
  const redirectUri = 'https://whyhe.top/callback';
  const scope = url.searchParams.get('scope') || 'repo';
  const state = url.searchParams.get('state') || '';

  const authUrl =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`;

  return Response.redirect(authUrl, 302);
}
