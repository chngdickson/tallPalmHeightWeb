//https://github.com/masterzdran/mz-logging-azure-tablestorage

async function uploadToAzure(file) {
    // INPUT:
    //      file = {
    //          name = ""
    //          gb   = ""    
    //         }
    const http_response  = await fetch("http://localhost:7071/api/getBlobToken", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name , filesizeInGB: this.filesizeInGB(file)})
    });
        // Using Body to send filename
        // Because Filenames with Special characters [*@&$)%_]
        // will break the request query
    const response_json = await http_response.json();
    if (response_json["status"]==="unsuccessful"){
        throw new Error(message || response_json["message"]);
    }
    const primary_endpoint = response_json["primary_endpoint"];
    const sas_token = response_json["sas_token"];
    const container_name = response_json["container_name"];
    const blob_name = response_json["blob_name"]; 

    // Upload your file to blob
    const sas_url = `${primary_endpoint}?${sas_token}`;
    const blobServiceClient = new BlobServiceClient(sas_url);
    const containerClient = blobServiceClient.getContainerClient(container_name);
    const blockBlobClient = containerClient.getBlockBlobClient(blob_name);
    await blockBlobClient.uploadData(file, {
        onProgress: (progress) => {
            const percent = Math.round((progress.loadedBytes / file.size) * 100);
        },
    });
}

async function callProcessFunction(file, n_retries=0) {
    // INPUT:
    //      file = {
    //          name = ""   
    //         }

    // Start processing
    const response = await fetch('http://localhost:7071/api/getTokenPubSub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            filename: file.name
        })
        // Using Body to send filename
        // Because Filenames with Special characters [*@&$)%_]
        // will break the request query
    });
    
    // Tokens to Initiate a pubsub object
    const http_result = await response.json();
    if (response_json["status"]==="unsuccessful"){
        throw new Error(message || response_json["message"]);
    }
    if (http_result["status"]==="success"){
        const url_token = http_result["url_token"];
        const group_name = http_result["group_name"];
        
        // Connect and listen with temporary url token
        const client_obj = new WebPubSubClient({ url_token });
        client_obj.on("group-message", (e) => {
            if (IsJson(e.message.data)){
                    const json_msg = JSON.parse(e.message.data);
            }});
        await client_obj.start(); // Connects to the service
        await client_obj.joinGroup(group_name);
    }}

async function getQueries(file, n_retries){
    
    // Start processing
    const response = await fetch(`http://localhost:7071/api/getQueries/${page}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
                
    if (!response.ok) {
        throw new Error(`http Az Func error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    currentPage = data.pagination.current_page;
    totalPages = data.pagination.total_pages;
}

