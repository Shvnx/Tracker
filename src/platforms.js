async function fetchInstagram(token, postId) {
  let id = postId;
  if (!id) {
    const r = await fetch(`https://graph.instagram.com/me/media?fields=id&limit=1&access_token=${token}`);
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    id = j.data[0].id;
  }
  const r = await fetch(`https://graph.instagram.com/${id}?fields=id,like_count,comments_count,media_type,timestamp&access_token=${token}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return { views: 0, likes: j.like_count || 0, comments: j.comments_count || 0 };
}
async function fetchTwitter(token, tweetId) {
  if (tweetId) {
    const r = await fetch(`https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const j = await r.json();
    if (j.errors) throw new Error(j.errors[0].detail);
    const m = j.data.public_metrics;
    return { views: m.impression_count || 0, likes: m.like_count || 0, comments: m.reply_count || 0 };
  }
  const ur = await fetch('https://api.twitter.com/2/users/me', { headers: { Authorization: 'Bearer ' + token } });
  const uj = await ur.json();
  if (uj.errors) throw new Error(uj.errors[0].detail);
  const tr = await fetch(`https://api.twitter.com/2/users/${uj.data.id}/tweets?max_results=5&tweet.fields=public_metrics`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const tj = await tr.json();
  if (tj.errors) throw new Error(tj.errors[0].detail);
  const m = tj.data[0].public_metrics;
  return { views: m.impression_count || 0, likes: m.like_count || 0, comments: m.reply_count || 0 };
}
async function fetchSnapshot(platform, token, postId) {
  if (platform === 'instagram') return fetchInstagram(token, postId);
  if (platform === 'twitter') return fetchTwitter(token, postId);
  throw new Error('Unsupported platform: ' + platform);
}
module.exports = { fetchSnapshot };
