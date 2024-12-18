const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const targetUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const { title, content, status, wordpressToken } = req.body;

    try {
        // Validate input
        if (!wordpressToken) {
            throw new Error("Missing WordPress JWT token.");
        }

        // Forward the request to WordPress
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wordpressToken}`,
            },
            body: JSON.stringify({ title, content, status: status || "publish" }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "WordPress API Error");
        }

        res.status(200).json({ success: true, link: data.link });
    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};
