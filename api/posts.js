const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const wordpressApiUrl = 'https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts';

  // Allow only POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST only.' });
  }

  try {
    const { title, content, status, wordpressToken } = req.body;

    // Validate required fields
    if (!title || !content || !status || !wordpressToken) {
      return res.status(400).json({ error: 'Missing required fields: title, content, status, wordpressToken' });
    }

    // Forward the request to WordPress API
    const response = await fetch(wordpressApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wordpressToken}`,
      },
      body: JSON.stringify({
        title,
        content,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WordPress API Error:", data);
      return res.status(response.status).json({ error: 'Failed to publish content to WordPress', details: data });
    }

    res.status(201).json({ message: 'Content published successfully!', link: data.link, id: data.id });

  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
