async function fetchInstagram(rapidApiKey, postUrl) {
  const url = `https://instagram-scraper-stable-api.p.rapidapi.com/get_media_data.php?reel_post_code_or_url=${encodeURIComponent(postUrl)}&type=reel`;
  const r = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey
    }
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return {
    views: j.video_play_count || j.video_view_count || 0,
    likes: j.like_count || 0,
    comments: j.comment_count || 0
  };
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
  const tr = await fetch(`https://api.twitter.com/2/users/${uj.data.id}/tweets?max_results=5&tweet.fields=public_metrics`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const tj = await tr.json();
  const m = tj.data[0].public_metrics;
  return { views: m.impression_count || 0, likes: m.like_count || 0, comments: m.reply_count || 0 };
}

async function fetchSnapshot(platform, token, postId) {
  if (platform === 'instagram') return fetchInstagram(token, postId);
  if (platform === 'twitter') return fetchTwitter(token, postId);
  throw new Error('Unsupported platform: ' + platform);
}

module.exports = { fetchSnapshot };
