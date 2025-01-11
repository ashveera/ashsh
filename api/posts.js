const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";

    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { title, content, status, wordpressToken } = req.body;

        if (!wordpressToken || !title || !content) {
            return res.status(400).json({
                error: "Missing required fields: wordpressToken, title, or content.",
            });
        }

        console.log("Creating post without images...");

        // Create the post in WordPress
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                content, // Initially post content without images
                status: status || "publish",
            }),
        });

        const postData = await postResponse.json();

        if (!postResponse.ok) {
            throw new Error(postData.message || "Failed to create post.");
        }

        console.log("Post created successfully:", postData.link);

        // Respond to the frontend immediately
        res.status(200).json({ success: true, link: postData.link, postId: postData.id });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error." });
    }
};
