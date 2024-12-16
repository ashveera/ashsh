import fetch from 'node-fetch';

export default async function handler(req, res) {
  const targetUrl = 'https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts';

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch posts', details: error.message });
  }
}
