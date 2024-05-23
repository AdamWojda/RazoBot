const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return; // Ignore messages from bots to prevent loops

        async function fetchQuickVidsLink(content) {
            try {
                const response = await fetch("https://api.quickvids.win/v1/shorturl/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ input_text: content }),
                });
                const data = await response.json();
                if (data.quickvids_url) {
                    return data.quickvids_url;
                }
                console.error("Failed to convert a TikTok link(s) to QuickVids link(s).");
                return content; // Fallback to original content if API call fails
            } catch (error) {
                console.error("Error fetching QuickVids link:", error);
                return content; // Fallback to original content on error
            }
        }

        const patterns = [
            /(http:|https:\/\/)?(www\.)?tiktok\.com\/(@.{1,24}|@[a-zA-Z0-9-_]{50,80})\/video\/(\d{1,30})(\?.*)?/,
            /(http:|https:\/\/)?(www\.)?tiktok.com\/t\/(\w{5,15})(\?.*)?/,
            /(http:|https:\/\/)?((?!ww)\w{2})\.tiktok.com\/(\w{5,15})(\?.*)?/,
            /(http:|https:\/\/)?(m\.|www\.)?tiktok\.com\/v\/(\d{1,30})(\?.*)?/,
            /(http:|https:\/\/)?(www)?\.tiktok\.com\/(.*)item_id=(\d{1,30})(\?.*)?/,
            // /(http:|https:\/\/)?(www\.)?instagram\.com\/reel\/([a-zA-Z0-9-_]{5,15})(\/)?(\?.*)?/,
        ];

        function checkForLinks(content) {
            const matchedLinks = [];

            for (const pattern of patterns) {
                const regex = new RegExp(pattern, "g");
                const matches = content.match(regex);
                if (matches) {
                    matchedLinks.push(...matches);
                }
            }

            return matchedLinks;
        }

        async function replaceLinks(content){
            const links = checkForLinks(content);
            for (const link of links) {
                try {
                    const quickvidsLink = await fetchQuickVidsLink(link);
                    content = content.replace(link, quickvidsLink);
                } catch (error) {
                }
            }

            return content;
        }
        console.log(`[3] Message received in ${message.channel.name}: ${message.content}`);


        // Enhanced regular expression to detect any TikTok link
        const tikTokRegex = /https?:\/\/\S*tiktok\.com\/\S*/g;
        const matches = message.content.match(tikTokRegex);

        console.log(`[2] TT ${matches}`); // Log detected TikTok URLs


        if (matches) {
            for (const url of matches) {
                const quickVidsUrl = await replaceLinks(url);
                console.log('quickVidsUrl', quickVidsUrl);
                console.log('url', url);

                // Send the embed to the same channel
                message.channel.send(quickVidsUrl)
                    .catch(console.error);
            }

            // Attempt to delete the original message
            await message.delete()
                .catch(error => console.error(`Could not delete the message due to: ${error}`));
        }
    },
};