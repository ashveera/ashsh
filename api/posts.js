const express = require("express");
const fetch = require("node-fetch");
const app = express();

// Middleware to parse incoming JSON data
app.use(express.json());

// Endpoint to handle WordPress content creation
app.post("/api/posts", async (req, res) => {
    const targetUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts"; // WordPress endpoint
    const { title, content, status, wordpressToken } = req.body;

    try {
        // Validate input data
        if (!title || !content || !status || !wordpressToken) {
            return res.status(400).json({ error: "Missing required fields: title, content, status, or WordPress token." });
        }

        // Prepare the payload for WordPress
        const postData = { title, content, status };

        // Make a request to the WordPress API
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wordpressToken}`,
            },
            body: JSON.stringify(postData),
        });

        // Parse the response from WordPress
        const data = await response.json();

        if (!response.ok) {
            console.error("WordPress API Error:", data);
            return res.status(response.status).json({ error: data.message || "Unknown error from WordPress API" });
        }

        // Success response
        res.status(200).json({
            success: true,
            message: "Content successfully posted to WordPress!",
            link: data.link,
        });

    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).json({
            error: "Internal Server Error: Unable to post content to WordPress.",
            details: error.message,
        });
    }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});
