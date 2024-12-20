const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";

    try {
        // Check for POST method
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        // Parse and validate request body
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Empty request body" });
        }

        const { title, content, status, wordpressToken } = req.body;

        // Validate WordPress token
        if (!wordpressToken) {
            return res.status(400).json({ error: "Missing WordPress API token" });
        }

        console.log("Received WordPress Token:", wordpressToken);

        // Make API request to WordPress
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                content,
                status: status || "publish",
            }),
        });

        const postData = await postResponse.json();

        if (!postResponse.ok) {
            console.error("WordPress API Error Response:", postData);
            return res.status(500).json({ error: postData.message || "WordPress API error" });
        }

        console.log("WordPress Post Created Successfully:", postData.link);
        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Post Creation Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
