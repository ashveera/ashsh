const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json()); // Middleware to parse JSON

// Endpoint to handle WordPress content creation
app.post("/api/posts", async (req, res) => {
    const targetUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const { title, content, status, wordpressToken } = req.body;

    try {
        // Validate input data
        if (!title || !content || !status || !wordpressToken) {
            return res.status(400).json({
                error: "Missing required fields: title, content, status, or wordpressToken.",
            });
        }

        // Send data to WordPress API
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wordpressToken}`,
            },
            body: JSON.stringify({
                title,
                content,
                status,
            }),
        });

        // Attempt to parse response
        const data = await response.json();

        // Check for WordPress API errors
        if (!response.ok) {
            return res.status(response.status).json({
                error: data.message || "WordPress API error occurred.",
            });
        }

        // Success: Send back the links
        return res.status(200).json({
            success: true,
            message: "Content posted successfully!",
            link: data.link,
        });
    } catch (error) {
        console.error("Proxy Error:", error);

        // Ensure valid JSON response on server error
        return res.status(500).json({
            error: "Internal Server Error: Unable to post content to WordPress.",
            details: error.message,
        });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
