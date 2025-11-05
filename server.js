const port = process.env.PORT || 3000;
const domain = process.env.DOMAIN || 'localhost';
require('dotenv').config();
const express = require('express');
const { BlobServiceClient } = require("@azure/storage-blob");
const { AbortController } = require('@azure/abort-controller');
const { PassThrough } = require("stream");
const archiver = require('archiver');
const fs = require("fs");
const path = require("path");

//=============== Initialization ======================//
// App Imports
const app = express();
const cors = require('cors');
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [`https://${domain}`, `https://www.${domain}`]
      : [`http://localhost:${port}`, `http://127.0.0.1:${port}`]
}));

// Socket io 
const { Server } = require('socket.io');
const http = require('http');
const server = http.createServer(app);
app.use('/socket.io', express.static('./node_modules/socket.io/client-dist'));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [`https://${domain}`, `https://www.${domain}`]
      : "*",
    methods: ["GET", "POST"]
  }
});


server.listen(port, () => {
  console.log(`✅ Server running on http://${domain}:${port}`);
});

// // Start the App
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });
//============== END: Initialization ====================//




// ===================================================//
// =============== Index HTML ========================//
// ===================================================//
app.post('/api/getBlobToken2', async (req, res) => {
    try {
		/* Frontend API
		const response = await fetch('/api/getBlobToken2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    filename: file.name,
					gb : 0.153
                })
            });*/
        const { filename, gb } = req.body;
        
        const http_response = await fetch("http://localhost:7071/api/getBlobToken", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: filename, filesizeInGB: gb })
            });

        if (http_response.ok) {
            const response_json = await http_response.json();
            const primary_endpoint 	= response_json.primary_endpoint;
            const sas_token 		= response_json.sas_token;
            const container_name 	= response_json.container_name;
            const blob_name 		= response_json.blob_name; 
            const sas_url 			= `${primary_endpoint}?${sas_token}`;
            
            res.json({ sas_url, container_name, blob_name });
        } else {
            res.status(response.status).json({ error: 'Azure Function failed' });
        }
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post('/api/getTokenPubSub', async (req, res) => {
	/** FRONTEND
	 * const response = await fetch('/api/getTokenPubSub', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    filename: file.name
                })
            });
	 */
    try {
        const { filename } = req.body;
        
        const response = await fetch('http://localhost:7071/api/getTokenPubSub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: filename })
        });

        if (response.ok) {
            const data = await response.json();
            const url_token = data.url_token;
            const group_name = data.group_name;
            
            res.json({ url_token, group_name });
        } else {
            res.status(response.status).json({ error: 'Azure Function failed' });
        }
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ===================================================//
// =============== Data HTML ========================//
// ===================================================//
app.get(`/api/getQueries/:page`, async (req, res) => {
    /* Frontend api : 
		const response = await fetch(`/api/getQueries/${page}`);
	*/
    const page = req.params.page; // Will be "1"
    console.log(`page is : ${page}`);
    const response = await fetch(`http://localhost:7071/api/getQueries/${page}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`http Az Func error! status: ${response.status}`);
    }
    res.send(await response.json());
	console.warn(`Page, ${page}`);
});


io.on('connection', (socket) => {
    socket.on('download-zip', async (data, callback) => {
		/* 
		#### Frontend calls #####

			socket = io();
			socket.on('connect', () => {console.log('✅ Connected to server');});
			socket.on('connect_error', (error) => {console.error('❌ Connection failed:', error);});
			socket.on('zipping-progress', (data) => {console.log('Progress received:', data.percent);});
			socket.on("zipChunk", base64Chunk => {chunks.push(Uint8Array.from(atob(base64Chunk), c => c.charCodeAt(0)));});
			socket.emit('download-zip', { 
				foldername: "processed/folderA"
			}, (response) => {socket.disconnect();});
		
		#### Frontend calls #####
		*/
        try {
			/**
			#### Backend API calls #####

				Socket to publish
				socket.emit('zipping-progress', { percent });
			
			#### Backend API calls #####
			*/
			const {filename, blob_folder} = data;
				const http_response = await fetch(`http://localhost:7071/api/getDownloadBlobToken/`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			if (!http_response.ok){throw new Error(`Az Func get Blob Error`);}
			
			const response_json = await http_response.json();
			const primary_endpoint = response_json["primary_endpoint"];
			const sas_token = response_json["sas_token"];
			const container_name = response_json["container_name"];
			const sas_url = `${primary_endpoint}?${sas_token}`;
			const blobServiceClient = new BlobServiceClient(sas_url);
			const containerClient = blobServiceClient.getContainerClient(container_name);
			// List Folders in Azure
			let streamDict = {};
			let totalBytes = 0;
			let bytesProcessed = 0;
			let zip_filename = `${filenameWithoutExtension(filename)}.zip`;

			
			const output = fs.createWriteStream(zip_filename);
			const archive = archiver('zip', { 
				zlib: { level: 9 } ,
				highWaterMark: 1024 * 1024
			});
			const passthrough = new PassThrough();
			archive.pipe(passthrough);
			passthrough.on("data", chunk => {
				// console.log("Chunk size:", chunk.length); // see small increments
				bytesProcessed += chunk.length;
				socket.emit("zipChunk", chunk.toString("base64"));
				// socket.emit('zipping-progress', { stage: "zipping", percent: (bytesProcessed/totalBytes)*100});
			});
			archive.on('warning', (err) => {
				console.warn('Archive warning:', err);
			});
			archive.on('error', (err) => {
				console.error('Archive error:', err);
				if (!callback.headersSent) {callback({ ok: false, error: 'Archive error'});}
			});
			archive.on("finish", () => {
				// socket.emit('zipping-progress', { stage: "zipping", percent: 100});
			});
			output.on('close', () => {
				console.log(archive.pointer() + ' total bytes');
				console.log('archiver has been finalized and the output file descriptor has closed.');
			});
			
			const azureBlobs = [];
			for await (const blob of containerClient.listBlobsFlat()) {
				azureBlobs.push(blob);
			}
			let i = 0;
			let len_blobs = Object.keys(azureBlobs).length;
			console.log(len_blobs);
			for (const blob of azureBlobs) {  // Use for...of, not for...in
				i++;
				const blobName = blob.name;   // Now blob is the actual blob object
				
				if (blobName.startsWith(blob_folder)) {
					const blobClient = containerClient.getBlobClient(blobName);  // You were missing this!
					const response = await blobClient.download(0);
					const readableStream = response.readableStreamBody;
					totalBytes += blob.properties.contentLength;
					archive.append(readableStream, { name: blobName });

					readableStream.on('error', (err) => console.error(`Stream error for ${blobName}:`, err));
					socket.emit('zipping-progress', { 
						stage: "zipping", percent: (i/len_blobs)*100
					});
				}
			}
			console.log("all blobs are streamed");
			socket.emit('zipping-progress', { stage: "zipping", percent: 100});
			await archive.finalize();
            callback({ ok: true, data: response_json, zip_filename: zip_filename});
            
        } catch (error) {
			if (socket){
				socket.disconnect();
			}
            console.error(error);
            callback({ ok: false, error: error.message, zip_filename: null});
        }
		if (socket){socket.disconnect();}
    });
});

function filenameWithoutExtension(filename){
	let split = filename.split('.');
	split.pop();
	let finalName = split.join(".");
	return finalName
}
app.listen(3000, () => console.log("Server running at http://localhost:3000"));