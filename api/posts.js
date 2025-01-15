const fetch = globalThis.fetch || require("node-fetch");

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
            try {
                const response = await fetch(imageUrl);

                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.statusText}`);
                }

                const mimeType = response.headers.get("content-type");
                const validMimeTypes = ["image/jpeg", "image/png"];

                if (!validMimeTypes.includes(mimeType)) {
                    throw new Error(`Unsupported image type: ${mimeType}. Only JPEG and PNG are allowed.`);
                }

                const fileExtension = mimeType.split("/")[1]; // Get file extension (e.g., jpeg, png)
                const imageBuffer = await response.buffer();

                const imageResponse = await fetch(mediaUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${wordpressToken}`,
                        "Content-Type": mimeType,
                        "Content-Disposition": `attachment; filename="featured-image.${fileExtension}"`,
                    },
                    body: imageBuffer,
                });

                const imageData = await imageResponse.json();

                if (!imageResponse.ok) {
                    throw new Error(imageData.message || "Image upload failed");
                }

                featuredMediaId = imageData.id; // Get the attachment ID for the uploaded media
                console.log("Uploaded Image ID:", featuredMediaId);
            } catch (err) {
                console.error("Image Upload Error:", err.message);
                return res.status(500).json({ error: err.message });
            }
        }

        // Step 2: Create the post in WordPress
        try {
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
                    featured_media: featuredMediaId || undefined,
                }),
            });

            const postData = await postResponse.json();

            if (!postResponse.ok) {
                throw new Error(postData.message || "Failed to create post");
            }

            console.log("WordPress Post Created Successfully:", postData.link);
            res.status(200).json({ success: true, link: postData.link });
        } catch (err) {
            console.error("Post Creation Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    } catch (error) {
        console.error("General Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
