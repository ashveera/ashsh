const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const wordpressApiUrl = 'https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts';

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { title, content, status, wordpressToken } = req.body;

    if (!title || !content || !status || !wordpressToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await fetch(wordpressApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wordpressToken}`,
      },
      body: JSON.stringify({ title, content, status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error('Failed to post to WordPress');
    }

    res.status(201).json({ link: data.link, id: data.id });

  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
};
