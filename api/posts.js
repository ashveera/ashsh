const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const { title, content, status, wordpressToken } = req.body;

    try {
        if (!wordpressToken) throw new Error("Missing WordPress API token.");

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
            throw new Error(`WordPress Post Creation Error: ${postData.message}`);
        }

        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Post Creation Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
