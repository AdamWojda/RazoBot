const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.author.bot) return; // Ignore messages from bots

        // Regular expression to detect TikTok links
        const tikTokRegex = /https?:\/\/(www\.)?tiktok\.com\/\S+/g;
        const matches = message.content.match(tikTokRegex);

        if (matches) {
            matches.forEach(async url => {
                console.log(`TikTok URL found: ${url}`);
                // You can add more functionality here such as sending this URL to a specific channel
                // Example:
                const logChannel = message.guild.channels.cache.find(channel => channel.name === "tiktok-logs");
                if(logChannel) {
                    const embed = new MessageEmbed()
                        .setTitle("TikTok Link Detected")
                        .setDescription(`A TikTok link was posted in ${message.channel}: [Click Here](${url})`)
                        .setColor("BLUE")
                        .setTimestamp();
                    logChannel.send({ embeds: [embed] });
                }
            });
        }
    },
};
