require("dotenv").config();
const Discord = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const { handleTawkWebhook } = require("./webhooks/tawkWebhook");
const date = new Date();
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;
const { GatewayIntentBits, Partials } = require("discord.js");

const client = new Discord.Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.GuildMember],
});

client.slashcommands = new Discord.Collection();
let commands = [];
const slashFiles = fs
	.readdirSync("./slash")
	.filter((file) => file.endsWith(".js"));

for (const file of slashFiles) {
	const slashcmd = require(`./slash/${file}`);
	client.slashcommands.set(slashcmd.data.name, slashcmd);
	commands.push(slashcmd.data.toJSON());
}

const eventFiles = fs
	.readdirSync("./events")
	.filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);

	if (event.once) {
		client.once(event.name, (...args) =>
			event.execute(...args, client)
		);
	} else {
		client.on(event.name, (...args) =>
			event.execute(...args, client)
		);
	}
}

(async () => {
	const rest = new REST({ version: "10" }).setToken(TOKEN);
	console.log("Started refreshing application (/) commands.");
	await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
		body: commands,
	})
		.then(() => {
			console.log("↳ Successfully reloaded application (/) commands.");
			console.log(date.toUTCString());
		})
		.catch((err) => {
			if (err) {
				console.log(err);
				process.exit(1);
			}
		});

	await client.login(TOKEN).then(() => {
		console.log("Bot Started Successfully.");
	});

	// Setup Express server for webhooks
	const app = express();

	// Middleware
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	// Health check endpoint (useful for Railway)
	app.get("/", (req, res) => {
		res.status(200).json({
			status: "online",
			bot: client.user?.tag || "Not ready",
			timestamp: new Date().toISOString()
		});
	});

	// Tawk.to webhook endpoint
	app.post("/webhook/tawk", (req, res) => {
		handleTawkWebhook(req, res, client);
	});

	// Start the Express server
	app.listen(PORT, () => {
		console.log(`Webhook server listening on port ${PORT}`);
		console.log(`Tawk.to webhook URL: https://your-app.railway.app/webhook/tawk`);
	});
})();
