export default async (request, context) => {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';

    // Bot crawlers-ஐ மட்டும் இடைமறிக்கவும் — மற்றவர்களுக்கு சாதாரண SPA
    const isBot = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|Googlebot/i.test(userAgent);

    if (!isBot) {
        return context.next();
    }

    // /blog/:id -இலிருந்து post id-ஐ எடுக்கவும்
    const match = url.pathname.match(/^\/blog\/([^/]+)/);
    if (!match) {
        return context.next();
    }
    const id = match[1];

    // Supabase REST API வழியாக post-ஐ நேரடியாக fetch செய்யவும்
    const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${id}&select=*`,
        {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
        }
    );
    const [post] = await res.json();

    if (!post) {
        return context.next();
    }

    const images = Array.isArray(post.images) && post.images.length > 0
        ? post.images
        : post.featured_image_url
            ? [post.featured_image_url]
            : [];
    const coverImage = images[0] || '';
    const description = (post.content || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);
    const title = escapeHtml(post.title);
    const desc = escapeHtml(description);
    const pageUrl = url.href;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="Old Boys Association" />
  ${coverImage ? `<meta property="og:image" content="${coverImage}" />` : ''}
  ${coverImage ? `<meta property="og:image:width" content="1200" />` : ''}
  ${coverImage ? `<meta property="og:image:height" content="630" />` : ''}

  <meta name="twitter:card" content="${coverImage ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  ${coverImage ? `<meta name="twitter:image" content="${coverImage}" />` : ''}

  <meta http-equiv="refresh" content="0; url=${pageUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${pageUrl}">${title}</a>...</p>
</body>
</html>`;

    return new Response(html, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
    });
};

function escapeHtml(str = '') {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export const config = { path: '/blog/*' };