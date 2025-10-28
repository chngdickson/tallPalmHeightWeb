import { BlockBlobClient } from "@azure/storage-blob";
import { BlobServiceClient } from "@azure/storage-blob";

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progressBar");


uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select a file first.");
        return;
    }
    console.log(file)

    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    // Container URL
    // https://appresourcegroupabc.blob.core.windows.net/tph-files/pointcloudUploads/
    // SAS URL
    // https://appresourcegroupabc.blob.core.windows.net/tph-files/pointcloudUploads/README_CMD.md
    // Step 1: Ask backend for upload URL

    const response  = await fetch("http://localhost:7071/api/getBlobToken");
    const response_json = await response.json();
    const primary_endpoint = response_json["primary_endpoint"];
    const sas_token = response_json["sas_token"];
    const container_name = response_json["container_name"];
    const blob_name = response_json["blob_name"];
    const filename = file.name;
    // New File Location
    const blobPath = `${blob_name}${filename}`;

    
    const sas_url = `${primary_endpoint}?${sas_token}`;
    const blobServiceClient = new BlobServiceClient(sas_url);
    const containerClient = blobServiceClient.getContainerClient(container_name);
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    await blockBlobClient.uploadData(file, {
        onProgress: (progress) => {
            const percent = Math.round((progress.loadedBytes / file.size) * 100);
            progressBar.style.width = percent + "%";
            progressBar.textContent = percent + "%";
        },
    });

});
