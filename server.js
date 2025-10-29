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

io.on('connection', (socket) => {
    socket.on('getBlobToken', async (data, callback) => {
		/* #### Frontend calls ####
			socket = io();
			socket.on('connect', () => {console.log('✅ Connected to server');});
			socket.on('connect_error', (error) => {console.error('❌ Connection failed:', error);});
			socket.on('upload-progress', (data) => {console.log('Progress received:', data.percent);});
			socket.emit('getBlobToken', { 
				filename: file.name, 
				gb: 0.7, 
				file: file 
			}, (response) => {socket.disconnect();});
		*/
        try {
			// socket.emit('upload-progress', { percent });
            const { filename, gb, file } = data; // Add file parameter
            console.log(`${filename}, ${gb}`);
            
            const http_response = await fetch("http://localhost:7071/api/getBlobToken", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: filename, filesizeInGB: gb })
            });
            
            const response_json = await http_response.json();
            if (!http_response.ok) {
                throw new Error(response_json.message || 'Request failed');
            }
            if (response_json.status === "unsuccessful") {
                throw new Error(response_json.message || 'Unsuccessful response');
            }

            const primary_endpoint = response_json.primary_endpoint;
            const sas_token = response_json.sas_token;
            const container_name = response_json.container_name;
            const blob_name = response_json.blob_name; 
            const sas_url = `${primary_endpoint}?${sas_token}`;
            
            const blobServiceClient = new BlobServiceClient(sas_url);
            const containerClient = blobServiceClient.getContainerClient(container_name);
            const blockBlobClient = containerClient.getBlockBlobClient(blob_name);
            
            await blockBlobClient.uploadData(file, {
                onProgress: (progress) => {
                    const percent = Math.round((progress.loadedBytes / file.length) * 100);
                    console.log(`Progress: ${percent}%`);
					// Upload Progress Socket!!!
                    socket.emit('upload-progress', { percent });
                },
            });
            callback({ success: true, data: response_json });
            
        } catch (error) {
            console.error(error);
            callback({ success: false, error: error.message });
        }
    });
});

app.post('/api/getTokenPubSub', async (req, res) => {
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
    // frontend : 
    //      const response = await fetch(`/api/getQueries/${page}`);
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
});


io.on('connection', (socket) => {
    socket.on('download-zip', async (data, callback) => {
		/* #### Frontend calls ####
			socket = io();
			socket.on('connect', () => {console.log('✅ Connected to server');});
			socket.on('connect_error', (error) => {console.error('❌ Connection failed:', error);});
			socket.on('zipping-progress', (data) => {console.log('Progress received:', data.percent);});
			socket.on("zipChunk", base64Chunk => {chunks.push(Uint8Array.from(atob(base64Chunk), c => c.charCodeAt(0)));});
			socket.emit('download-zip', { 
				foldername: "processed/folderA"
			}, (response) => {socket.disconnect();});
		*/
        try {
			// Socket to publish
			// socket.emit('zipping-progress', { percent });
			const {foldername} = data;
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
			for await (const blob of containerClient.listBlobsFlat()) {
				const blobClient = containerClient.getBlobClient(blob.name);
				const response = await blobClient.download(0); // Download from offset 0
				streamDict[blob.name] = response.readableStreamBody;
				totalBytes += blob.properties.contentLength;
			}

			const output = fs.createWriteStream("all-files.zip");
			const archive = archiver('zip', { 
				zlib: { level: 9 } ,
				highWaterMark: 1024 * 1024
			});
			const passthrough = new PassThrough();
			archive.pipe(passthrough);
			passthrough.on("data", chunk => {
				// console.log("Chunk size:", chunk.length); // see small increments
				socket.emit("zipChunk", chunk.toString("base64"));
				bytesProcessed += chunk.length;
				socket.emit('zipping-progress', { stage: "zipping", percent: (bytesProcessed/totalBytes)*100});
			});
			archive.on('warning', (err) => {
				console.warn('Archive warning:', err);
			});
			archive.on('error', (err) => {
				console.error('Archive error:', err);
				if (!callback.headersSent) {callback({ ok: false, error: 'Archive error'});}
			});
			archive.on("finish", () => {
				socket.emit('zipping-progress', { stage: "zipping", percent: 100});
			});
			output.on('close', () => {
				console.log(archive.pointer() + ' total bytes');
				console.log('archiver has been finalized and the output file descriptor has closed.');
			});
			
			// Pipe archive directly to HTTP response
			// archive.pipe(callback);
			
			// Append all streams to archive
			let index = 0;
			let len_zips = Object.keys(streamDict).length;
			for (const blobName in streamDict) {
				index++;
				const readableStream = streamDict[blobName];
				archive.append(readableStream, { name: blobName });
				readableStream.on('error', (err) => console.error(`Stream error for ${blobName}:`, err));
				socket.emit('zipping-progress', { 
					stage: "init", percent: (index/len_zips)*100
				});
			}
			console.log("all blobs are streamed");
			await archive.finalize();
            callback({ ok: true, data: response_json });
            
        } catch (error) {
            console.error(error);
            callback({ ok: false, error: error.message });
        }
    });
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));