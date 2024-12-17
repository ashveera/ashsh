const express = require("express");
const fetch = require("node-fetch"); // Import the fetch library for server-side HTTP requests
const app = express();

// Middleware to parse incoming JSON data
app.use(express.json());

// Endpoint to handle WordPress content creation
app.post("/api/posts", async (req, res) => {
    const targetUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts"; // WordPress REST API endpoint
    const { title, content, status, wordpressToken } = req.body; // Destructure fields from request body

    try {
        // Validate input data
        if (!title || !content || !status || !wordpressToken) {
            return res.status(400).json({ error: "Missing required fields: title, content, status, or WordPress token." });
        }

        // Prepare the payload to send to WordPress
        const postData = {
            title: title,
            content: content,
            status: status,
        };

        // Make a request to the WordPress REST API
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wordpressToken}`, // Use the provided WordPress token for authentication
            },
            body: JSON.stringify(postData),
        });

        const data = await response.json();

        // Check for errors in the WordPress response
        if (!response.ok) {
            console.error("WordPress API Error:", data);
            throw new Error(`WordPress API Error: ${data.message || "Unknown error"}`);
        }

        // Send success response back to the client
        res.status(200).json({
            success: true,
            message: "Content successfully posted to WordPress!",
            link: data.link,
        });
    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).json({
            success: false,
            error: error.message || "An unknown error occurred.",
        });
    }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});
