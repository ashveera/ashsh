const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { title, content, status, wordpressToken, imageUrl } = req.body;

        if (!wordpressToken || !title || !content) {
            return res.status(400).json({ error: "Missing required fields: wordpressToken, title, or content" });
        }

        console.log("Received Request:", { title, content, status, imageUrl });

        let featuredMediaId;

        // Step 1: Upload the image to WordPress
        if (imageUrl) {
            const imageResponse = await fetch(mediaUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${wordpressToken}`,
                    "Content-Type": "image/jpeg", // Update if the image format is different
                    "Content-Disposition": `attachment; filename="featured-image.jpg"`,
                },
                body: await fetch(imageUrl).then((res) => res.buffer()), // Fetch the image and send its binary data
            });

            const imageData = await imageResponse.json();

            if (!imageResponse.ok) {
                console.error("Image Upload Error:", imageData);
                return res.status(500).json({ error: imageData.message || "Image upload failed" });
            }

            featuredMediaId = imageData.id; // Get the attachment ID for the uploaded media
            console.log("Uploaded Image ID:", featuredMediaId);
        }

        // Step 2: Create the post in WordPress
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
                featured_media: featuredMediaId || undefined, // Attach the uploaded image as featured media
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
