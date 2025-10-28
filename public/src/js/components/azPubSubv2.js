// const { WebPubSubClient } = require("@azure/web-pubsub-client");
import { WebPubSubClient } from "@azure/web-pubsub-client";
// require("dotenv").config();


export default class MultiWebPubSubClient {
	/**
	 * 2 Parameters
	 * Dictionary must be in the format of 
	 * {token}
	 * group name and url
	 */
	constructor(res_json, div_containerId="id_UploadContainer") {
		this.container = document.getElementById(div_containerId);
		this.clients = this.init(res_json);
	}

	async init(res_json) {
		const client_list = [];
		if (!this.container) throw new Error("Container not found");
		this.container.innerHTML = "";

		// Initialize all clients
		for (const [group_name, group_name_dict] of Object.entries(res_json)) {
			console.log(`${group_name}: ${group_name_dict}`);
			const url_token = group_name_dict["url_token"]
			const client_obj = await this._initClient( group_name,url_token);
			client_list.push(client_obj);
		}
		return client_list;
	}

	async _initClient(group_name, pubsub_token_url) {
		// Html start
		await this._initBoxes(group_name); 
		//
		const getClientAccessUrl = pubsub_token_url;
		const client_obj = new WebPubSubClient({ getClientAccessUrl });
		client_obj.on("connected", (e) => {
			this._setStatus(group_name, `✅ Connected: ${e.connectionId}`);
		});
		client_obj.on("disconnected", (e) => {
			this._setStatus(group_name, `🔴 Disconnected: ${e.message}`);
		});
		client_obj.on("group-message", (e) => {
			if (e.message.data instanceof ArrayBuffer) {
				const msg_string = `Received message from ${e.message.group} ${Buffer.from(e.message.data).toString("base64")}`;
				console.log(msg_string);
				this._addMessage(group_name, msg_string);
			} else {
				const msg_string = `Received message from ${e.message.group} ${JSON.stringify(e.message.data)}`;
				console.log(msg_string);
				this._addMessage(group_name, msg_string);
			}
		});

		await client_obj.start(); // Connects to the service
		await client_obj.joinGroup(group_name);
		return client_obj;
	}

	// All these html is going to go in the future
	async _initBoxes(group_name){
		const box = this._createBox(group_name);
		this.container.appendChild(box);
	}

	
	// HtmlComponents
	_createBox(group_name) {
		const div = document.createElement("div");
		div.className = "cs_UploadBox";
		div.id = `pubsub-box-${group_name}`;
		div.innerHTML = `
			<h3>Connection ${group_name}</h3>
			<div class="cs_Uploadmessages" id="messages-${group_name}"></div>
			<div class="cs_Uploadstatus" id="status-${group_name}">Connecting...</div>
		`;
		return div;
	}

	_setStatus(index, text) {
		const el = document.getElementById(`status-${index}`);
		if (el) el.textContent = text;
	}

	_addMessage(index, msg) {
		const container = document.getElementById(`messages-${index}`);
		if (!container) return;

		const p = document.createElement("p");
		p.textContent = msg;
		container.appendChild(p);
		container.scrollTop = container.scrollHeight;
	}
}
// const multiClient = new MultiWebPubSubClient(tokenFetchers, "pubsub-container");
// multiClient.init();
