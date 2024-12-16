const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const wordpressApiUrl = 'https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts';

    // Allow POST requests only
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    try {
        const { title, content, status, wordpressToken } = req.body;

        // Validate required fields
        if (!title || !content || !status || !wordpressToken) {
            return res.status(400).json({ error: 'Missing required fields: title, content, status, wordpressToken.' });
        }

        // Send POST request to WordPress API
        const response = await fetch(wordpressApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${wordpressToken}`, // Pass the token received from index.html
            },
            body: JSON.stringify({
                title,
                content,
                status,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('WordPress API Error:', data);
            return res.status(response.status).json({
                error: 'Failed to publish content to WordPress.',
                details: data,
            });
        }

        // Success response
        res.status(201).json({
            message: 'Content posted successfully!',
            link: data.link,
            id: data.id,
        });
    } catch (error) {
        console.error('Proxy Error:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
        });
    }
};
