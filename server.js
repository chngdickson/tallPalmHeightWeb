const port = process.env.PORT || 3000;
const domain = process.env.DOMAIN || 'localhost';
require('dotenv').config();
const express = require('express');
const { BlobServiceClient } = require("@azure/storage-blob");
const { AbortController } = require('@azure/abort-controller');
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
        try {
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
                    socket.emit('upload-progress', { percent });
                },
            });
            
            // Use callback instead of res.send()
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

app.get('/api/download-zip', async(req, res) => {
    try {
        const foldername = req.query.foldername || 'tph-files';
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
        
        
        const output = fs.createWriteStream("all-files.zip");
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="all-files.zip"`);
        const archive = archiver('zip', { 
            zlib: { level: 9 } ,
            highWaterMark: 1024 * 1024
        });
        
        archive.on('warning', (err) => {
            console.warn('Archive warning:', err);
        });
        
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) res.status(500).send('Archive error');
        });
        output.on('close', () => {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
        });
        // Pipe archive directly to HTTP response
        archive.pipe(res);
        
        const streamDict = {};
        
        // Get all blob streams first
        for await (const blob of containerClient.listBlobsFlat()) {
            const blobClient = containerClient.getBlobClient(blob.name);
            const response = await blobClient.download(0); // Download from offset 0
            streamDict[blob.name] = response.readableStreamBody;
        }
        
        // Append all streams to archive
        for (const blobName in streamDict) {
            const readableStream = streamDict[blobName];
            archive.append(readableStream, { name: blobName });
            readableStream.on('error', (err) => console.error(`Stream error for ${blobName}:`, err));
        }
        
        await archive.finalize();
        
    } catch (error) {
        console.error('Download zip error:', error);
        if (!res.headersSent) res.status(500).json({ error: error.message });
    }
});


async function streamsToCompressed(streamDict, outputFilePath) {  
  return new Promise((resolve, reject) => {  

    const fs = require("fs");
    const archiver = require('archiver');

    // create a file to stream archive data to. 
    // In case you want to directly stream output in http response of express, just grab 'res' in that case instead of creating file stream
    const output = fs.createWriteStream(outputFilePath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="all-files.zip"`);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
      highWaterMark: 1024 * 1024 // 1MB chunks
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });
    
    // good practice to catch this error explicitly
    archive.on('error', (err) => {
      throw err;
    });    
 
    // pipe archive data to the file
    archive.pipe(res);
    
    for(const blobName in streamDict) {
        const readableStream = streamDict[blobName];
        
        // finalize the archive (ie we are done appending files but streams have to finish yet)
        archive.append(readableStream, { name: blobName });

        readableStream.on("error", reject);
    }

    archive.finalize();
    resolve();
  });
}




/**
 *                     
const fileName = e.target.closest('tr').querySelector('td:nth-child(2)').textContent.trim();
const downloadBtn = e.target.closest('.download-btn');
const row = downloadBtn.closest('tr');
const rowId = row.id.replace('row_elem', '');

// Get the actual download URL from your data
const downloadUrl = downloadBtn.getAttribute('data-url') || 
                downloadBtn.href || 
                downloadBtn.textContent;
const az_dl = new AzureBlobDownloader();
await az_dl.downloadAllBlobs();
 */