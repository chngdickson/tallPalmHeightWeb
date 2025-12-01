require('dotenv').config();
const port = process.env.PORT || 3000;
const domain = process.env.DOMAIN || 'localhost';
const az_domain = process.env.AZ_DOMAIN || "az-func-domain-name.azurewebsites.net";
const protocol = az_domain.includes('localhost') ? 'http' : 'https';
const full_url = `${protocol}://${az_domain}`;
const AZURE_FUNCTION_KEY = process.env.AZURE_FUNCTION_KEY || 'az-func-key';


const express = require('express');
const { finished } = require('stream/promises');
const { BlockBlobClient } = require("@azure/storage-blob");
const { PassThrough } = require("stream");
const fs = require("fs");

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
        const http_response = await fetch(`${full_url}/api/getBlobToken`, {
                method: 'POST',
                headers: { 
					'Content-Type': 'application/json',
					'x-functions-key': AZURE_FUNCTION_KEY
				},
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
            res.status(http_response.status).json({ error: 'Azure Function failed' });
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
        
        const response = await fetch(`${full_url}/api/getTokenPubSub`, {
            method: 'POST',
			headers: { 
				'Content-Type': 'application/json',
				'x-functions-key': AZURE_FUNCTION_KEY
			},
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
	console.log(`${full_url}/api/getQueries`);
    const page = req.params.page; // Will be "1"
    console.log(`page is : ${page}`);
    const response = await fetch(`${full_url}/api/getQueries/${page}`, {
        method: 'GET',
		headers: { 
			'Content-Type': 'application/json',
			'x-functions-key': AZURE_FUNCTION_KEY
		}
    });
    if (!response.ok) {
        throw new Error(`http Az Func error! status: ${response.status}`);
    }
    res.send(await response.json());
	console.warn(`Page, ${page}`);
});

app.post(`/api/getDownloadToken`, async (req, res) => {
    /* Frontend api : 
		const response = await fetch(`/api/getDownloadToken`);
	*/
	const data = req.body;
	console.log(`${full_url}/api/getDownloadBlobToken/`);
	const http_response = await fetch(`${full_url}/api/getDownloadBlobToken/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-functions-key': AZURE_FUNCTION_KEY
		},
		body: JSON.stringify({ 
			processed_url	: data.processed_url, 
			filename		: data.filename,
			filetype		: data.filetype, 
		})
	});
	if (!http_response.ok){throw new Error(`Az Func get Blob Error`);}
	
	const response_json 	= await http_response.json();
    if (!http_response.ok) {
		res.status(http_response.status).json({ error: 'Azure Function Download failed' });
    }
	else{
		// res.status(True).json({ sas_token: sas_token, filename:filename});
		res.json({
			sas_token: response_json["sas_token"],
			filename:response_json["filename"]
		});
	}
});

function filenameWithoutExtension(filename){
	let split = filename.split('.');
	split.pop();
	let finalName = split.join(".");
	return finalName
}
app.listen(3000, () => console.log("Server running at http://localhost:3000"));