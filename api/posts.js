const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

    const { title, content, status, wordpressToken, featuredImageUrl } = req.body;

    try {
        // Validation: Ensure required fields are provided
        if (!wordpressToken) {
            throw new Error("Missing WordPress API token.");
        }
        if (!featuredImageUrl) {
            throw new Error("Missing featured image URL.");
        }

        let featuredImageId = null;

        // Step 1: Fetch and Upload Featured Image
        console.log("Fetching the featured image...");
        const imageResponse = await fetch(featuredImageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch the featured image. Status: ${imageResponse.status}`);
        }

        console.log("Converting the image to a buffer...");
        const imageBuffer = await imageResponse.buffer();

        console.log("Uploading the image to WordPress...");
        const mediaResponse = await fetch(mediaUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Disposition": 'attachment; filename="featured-image.jpg"',
                "Content-Type": "image/jpeg",
            },
            body: imageBuffer,
        });

        const mediaData = await mediaResponse.json();
        if (!mediaResponse.ok || !mediaData.id) {
            throw new Error(`Failed to upload image. WordPress response: ${JSON.stringify(mediaData)}`);
        }

        featuredImageId = mediaData.id; // Retrieve the uploaded image ID
        console.log(`Image uploaded successfully. Image ID: ${featuredImageId}`);

        // Step 2: Create WordPress Post with Uploaded Image
        console.log("Creating a new WordPress post...");
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wordpressToken}`,
            },
            body: JSON.stringify({
                title: title || "Untitled Post",
                content: content || "No content provided",
                status: status || "publish",
                featured_media: featuredImageId, // Attach the uploaded image
            }),
        });

        const postData = await postResponse.json();
        if (!postResponse.ok) {
            throw new Error(`Failed to create post. WordPress response: ${JSON.stringify(postData)}`);
        }

        console.log("Post created successfully!");
        res.status(200).json({
            success: true,
            message: "Post created successfully!",
            link: postData.link,
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};
