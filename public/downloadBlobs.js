import { BlobServiceClient } from "@azure/storage-blob";
async function uploadToAzure(file) {
    try{
        const http_response  = await fetch("http://localhost:7071/api/getBlobToken", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name , filesizeInGB: this.filesizeInGB(file)})
        });
        const response_json = await http_response.json();
        if (!http_response.ok){
            throw new Error(message || response_json["message"]);
        }
        if (response_json["status"]==="unsuccessful"){
            throw new Error(message || response_json["message"]);
        }
        
        const primary_endpoint = response_json["primary_endpoint"];
        const sas_token = response_json["sas_token"];
        const container_name = response_json["container_name"];
        const blob_name = response_json["blob_name"]; 
        const filename = file.name;
        console.log(`filename is ${filename}`)
        // New File Location
        // const blobPath = `${blob_name}${filename}`;
        console.log(blob_name)
        const sas_url = `${primary_endpoint}?${sas_token}`;
        const blobServiceClient = new BlobServiceClient(sas_url);
        const containerClient = blobServiceClient.getContainerClient(container_name);
        const blockBlobClient = containerClient.getBlockBlobClient(blob_name);
        await blockBlobClient.uploadData(file, {
            onProgress: (progress) => {
                const percent = Math.round((progress.loadedBytes / file.size) * 100);
                this.dom.updateProgress(file.name, 'upload', percent);
            },
        });
        return true;
    }
    catch(error){
        this.markFileAsError(file, `Upload Error : ${error.message}`);
        return false;
    }
}



export class AzureBlobDownloader {
    constructor() {
    }
    async get_tokens(container_name){
        try{
            const http_response  = await fetch("http://localhost:7071/api/getDownloadBlobToken", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const primary_endpoint = response_json["primary_endpoint"];
            const sas_token = response_json["sas_token"];
            const container_name = response_json["container_name"];
            const sas_url = `${primary_endpoint}?${sas_token}`;
            this.blobServiceClient = new BlobServiceClient(sas_url);
            this.containerClient = blobServiceClient.getContainerClient(container_name);
        }
        catch(error){
            console.log(error)
        }
    }
    // 1. List all blobs in container
    async listBlobs(containerClient) {        
        const blobs = [];
        for await (const blob of containerClient.listBlobsFlat()) {
            blobs.push({
                name: blob.name,
                size: blob.properties.contentLength,
                lastModified: blob.properties.lastModified
            });
        }
        return blobs;
    }

    // 2. Download a single blob using WHATWG File System API
    async downloadBlob(blobName, containerClient) {
        if (!('showSaveFilePicker' in window)) {
            throw new Error('File System API not supported. Use Chrome or Edge.');
        }
        const blobClient = containerClient.getBlobClient(blobName);

        // User selects save location
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: blobName,
        });

        // Download and stream directly to disk
        const response = await blobClient.download();
        const writable = await fileHandle.createWritable();
        await response.readableStreamBody.pipeTo(writable);

        return fileHandle;
    }

    // 3. Download all blobs from the container
    async downloadAllBlobs() {
        const http_response  = await fetch("http://localhost:7071/api/getDownloadBlobToken", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
        });
        if (http_response.ok){
            const response_json = await http_response.json();
            const primary_endpoint = response_json["primary_endpoint"];
            const sas_token = response_json["sas_token"];
            const container_name = response_json["container_name"];
            const sas_url = `${primary_endpoint}?${sas_token}`;
            const blobServiceClient = new BlobServiceClient(sas_url);
            const containerClient = blobServiceClient.getContainerClient(container_name);
            const blobs = await this.listBlobs(containerClient);
            console.log(`Found ${blobs.length} blobs to download`);

            const listOptions = {
                includeMetadata: true,
                includeSnapshots: true,
                prefix: '' // Filter results by blob name prefix
            };
            const maxPageSize = 2;
            
            // Download each blob
            for await (const response of containerClient
                .listBlobsFlat(listOptions)
                .byPage({ maxPageSize })) {
                console.log("- Page:");
                if (response.segment.blobItems) {
                    for (const blob of response.segment.blobItems) {
                        console.log(`  - ${blob.name}`);
                        const blobClient = containerClient.getBlobClient(blob.name);
                        const downloadBlockBlobResponse = await blobClient.download();
                        const url =window.URL.createObjectURL(await downloadBlockBlobResponse.blobBody);
                        this.downloadURI(url,blob.name)
                    }
                }
            }
        }
    }
    downloadURI(uri, name) 
    {
        var link = document.createElement("a");
        link.download = name;
        link.href = uri;
        link.click();
    };
}