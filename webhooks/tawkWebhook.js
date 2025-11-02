const { EmbedBuilder } = require("discord.js");

/**
 * Handles incoming Tawk.to webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} client - Discord client instance
 */
async function handleTawkWebhook(req, res, client) {
	try {
		const webhookData = req.body;

		// Get the Discord channel ID from environment variables
		const channelId = process.env.TAWK_DISCORD_CHANNEL_ID;

		if (!channelId) {
			console.error("TAWK_DISCORD_CHANNEL_ID not configured in environment variables");
			return res.status(500).json({ error: "Channel not configured" });
		}

		// Get the Discord channel
		const channel = await client.channels.fetch(channelId);

		if (!channel) {
			console.error(`Discord channel ${channelId} not found`);
			return res.status(404).json({ error: "Channel not found" });
		}

		// Handle different Tawk.to webhook events
		// Most common event is "chat:start" and "chat:message"
		const event = webhookData.event || webhookData.type;

		if (event === "chat:start") {
			// New chat started
			const embed = new EmbedBuilder()
				.setColor("#00ff00")
				.setTitle("🆕 New Chat Started")
				.setDescription(`A new chat has been initiated`)
				.addFields(
					{ name: "Visitor Name", value: webhookData.visitor?.name || "Anonymous", inline: true },
					{ name: "Visitor Email", value: webhookData.visitor?.email || "Not provided", inline: true },
					{ name: "Chat ID", value: webhookData.chatId || "Unknown", inline: false }
				)
				.setTimestamp();

			await channel.send({ embeds: [embed] });

		} else if (event === "chat:message" || webhookData.message) {
			// New message in chat
			const message = webhookData.message?.text || webhookData.text || webhookData.message;
			const senderName = webhookData.message?.sender?.name || webhookData.visitor?.name || "Guest";
			const senderType = webhookData.message?.sender?.type || webhookData.senderType || "visitor";

			// Only forward visitor/guest messages, not agent responses
			if (senderType === "visitor" || senderType === "guest") {
				const embed = new EmbedBuilder()
					.setColor("#0099ff")
					.setTitle(`💬 Message from ${senderName}`)
					.setDescription(message)
					.addFields(
						{ name: "Sender", value: senderName, inline: true },
						{ name: "Chat ID", value: webhookData.chatId || "Unknown", inline: true }
					)
					.setTimestamp();

				if (webhookData.visitor?.email) {
					embed.addFields({ name: "Email", value: webhookData.visitor.email, inline: true });
				}

				await channel.send({ embeds: [embed] });
			}

		} else if (event === "chat:end") {
			// Chat ended
			const embed = new EmbedBuilder()
				.setColor("#ff0000")
				.setTitle("🔚 Chat Ended")
				.setDescription(`Chat session has ended`)
				.addFields(
					{ name: "Visitor Name", value: webhookData.visitor?.name || "Anonymous", inline: true },
					{ name: "Chat ID", value: webhookData.chatId || "Unknown", inline: true }
				)
				.setTimestamp();

			await channel.send({ embeds: [embed] });

		} else {
			// Handle generic webhook events - forward the message content
			const messageText = webhookData.message?.text || webhookData.text || JSON.stringify(webhookData, null, 2);
			const visitorName = webhookData.visitor?.name || webhookData.message?.sender?.name || "Guest";

			const embed = new EmbedBuilder()
				.setColor("#ffa500")
				.setTitle(`📨 Tawk.to Notification from ${visitorName}`)
				.setDescription(messageText.substring(0, 4000)) // Discord description limit
				.addFields(
					{ name: "Event Type", value: event || "Unknown", inline: true }
				)
				.setTimestamp();

			if (webhookData.chatId) {
				embed.addFields({ name: "Chat ID", value: webhookData.chatId, inline: true });
			}

			await channel.send({ embeds: [embed] });
		}

		// Respond to Tawk.to that webhook was received successfully
		res.status(200).json({ success: true, message: "Webhook received" });

	} catch (error) {
		console.error("Error handling Tawk.to webhook:", error);
		res.status(500).json({ error: "Internal server error", details: error.message });
	}
}

module.exports = { handleTawkWebhook };
