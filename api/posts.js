const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const { title, content, status, wordpressToken } = req.body;

    console.log("Received WordPress Token:", wordpressToken);

    try {
        // Validate the incoming WordPress token
        if (!wordpressToken) {
            throw new Error("Missing WordPress API token.");
        }

        // Make the API request to create a WordPress post
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

        // Parse the response from the WordPress API
        const postData = await postResponse.json();

        // Check for errors in the response
        if (!postResponse.ok) {
            console.error("WordPress API Error Response:", postData);
            throw new Error(`WordPress Post Creation Error: ${postData.message}`);
        }

        // Respond back with the success message and link
        console.log("WordPress Post Created Successfully:", postData.link);
        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        // Log and return any errors encountered
        console.error("Post Creation Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
