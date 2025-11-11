// import { WebPubSubClient } from "@azure/web-pubsub-client";
// import { BlobServiceClient } from "@azure/storage-blob";
import { 
    BlobServiceClient, 
    WebPubSubClient, 
    CosmosClient 
} from '../../../dist/bundle.js';

function IsJson(str){
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
class UploadDOM {
    constructor() {
        this.elements = {};
    }
    
    init() {
        this.getDOMElements();
        return this.elements;
    }
    
    getDOMElements() {
        this.elements = {
            dropZone: document.getElementById('drop-zone'),
            fileInput: document.getElementById('file-input'),
            browseBtn: document.getElementById('browse-btn'),
            uploadBtn: document.getElementById('upload-btn'),
            selectedFiles: document.getElementById('selected-files'),
            fileList: document.getElementById('file-list'),
            filesCount: document.getElementById('files-count'),
            totalFiles: document.getElementById('total-files'),
            totalSize: document.getElementById('total-size'),
            processTime: document.getElementById('process-time'),
            completedFiles: document.getElementById('completed-files'),
            completedFilesList: document.getElementById('completed-files-list'),
            errorReport: document.getElementById('error-report'),
            errorReportList: document.getElementById('error-report-list')
        };
        return this.elements;
    }
    
    createFileItem(file, fileSize, fileIcon, onRemoveClick) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.name = file.name;
        
        const fileHeader = document.createElement('div');
        fileHeader.className = 'file-header';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileIconDiv = document.createElement('div');
        fileIconDiv.className = 'file-icon';
        const iconElement = document.createElement('i');
        iconElement.className = fileIcon;
        fileIconDiv.appendChild(iconElement);
        
        const fileDetails = document.createElement('div');
        fileDetails.className = 'file-details';
        
        const fileNameDiv = document.createElement('div');
        fileNameDiv.className = 'file-name';
        fileNameDiv.textContent = file.name;
        
        const fileSizeDiv = document.createElement('div');
        fileSizeDiv.className = 'file-size';
        fileSizeDiv.textContent = fileSize;
        
        fileDetails.appendChild(fileNameDiv);
        fileDetails.appendChild(fileSizeDiv);
        fileInfo.appendChild(fileIconDiv);
        fileInfo.appendChild(fileDetails);
        
        const fileRemove = document.createElement('div');
        fileRemove.className = 'file-remove';
        fileRemove.dataset.name = file.name;
        
        const removeIcon = document.createElement('i');
        removeIcon.className = 'fas fa-times';
        fileRemove.appendChild(removeIcon);
        
        fileHeader.appendChild(fileInfo);
        fileHeader.appendChild(fileRemove);
        
        const processingPipeline = this.createProcessingPipeline(file.name);
        fileItem.appendChild(fileHeader);
        fileItem.appendChild(processingPipeline);
        
        fileRemove.addEventListener('click', onRemoveClick);
        
        return fileItem;
    }
    
    createProcessingPipeline(fileName) {
        const processingPipeline = document.createElement('div');
        processingPipeline.className = 'processing-pipeline';
        
        const pipelineTitle = document.createElement('div');
        pipelineTitle.className = 'pipeline-title';
        pipelineTitle.textContent = 'Processing Pipeline:';
        
        const pipelineSteps = document.createElement('div');
        pipelineSteps.className = 'pipeline-steps';
        
        const steps = [
            { name: 'upload', title: 'Uploading' },
            { name: 'process', title: 'Processing' },
            { name: 'store', title: 'Storing' }
        ];
        
        steps.forEach(step => {
            const stepDiv = document.createElement('div');
            stepDiv.className = `pipeline-step ${step.name}-step`;
            
            const stepTitle = document.createElement('div');
            stepTitle.className = 'step-title';
            stepTitle.textContent = step.title;
            
            const stepProgress = document.createElement('div');
            stepProgress.className = 'step-progress';
            
            const stepBar = document.createElement('div');
            stepBar.className = 'step-bar';
            stepBar.id = `${step.name}-bar-${fileName}`;
            
            stepProgress.appendChild(stepBar);
            
            const stepPercentage = document.createElement('div');
            stepPercentage.className = 'step-percentage';
            stepPercentage.id = `${step.name}-percent-${fileName}`;
            stepPercentage.textContent = '0%';
            
            stepDiv.appendChild(stepTitle);
            stepDiv.appendChild(stepProgress);
            stepDiv.appendChild(stepPercentage);
            pipelineSteps.appendChild(stepDiv);
        });
        
        processingPipeline.appendChild(pipelineTitle);
        processingPipeline.appendChild(pipelineSteps);
        
        return processingPipeline;
    }
    
    updateSummary(fileCount, totalSizeValue) {
        this.elements.filesCount.textContent = `(${fileCount})`;
        this.elements.totalFiles.textContent = fileCount;
        this.elements.totalSize.textContent = this.formatFileSize(totalSizeValue);
        
        const estimatedTime = Math.round(totalSizeValue / (1024 * 1024) * 0.8) + 2;
        this.elements.processTime.textContent = `${estimatedTime}s`;
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        else return (bytes / 1048576).toFixed(2) + ' MB';
    }
    
    getFileIcon(fileName) {
        try{
            const extension = fileName.split('.').pop().toLowerCase();
            
            if (['pdf'].includes(extension)) return 'far fa-file-pdf';
            if (['doc', 'docx'].includes(extension)) return 'far fa-file-word';
            if (['xls', 'xlsx'].includes(extension)) return 'far fa-file-excel';
            if (['ppt', 'pptx'].includes(extension)) return 'far fa-file-powerpoint';
            if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'far fa-file-archive';
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) return 'far fa-image';
            if (['mp4', 'mov', 'avi', 'wmv', 'flv'].includes(extension)) return 'far fa-file-video';
            if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) return 'far fa-file-audio';
            if (['txt', 'rtf'].includes(extension)) return 'far fa-file-alt';
            if (['laz','laz','pcd'].includes(extension)) return "far fa-file";
            
            return 'far fa-file';
        }
        catch(error){
            console.error(`something went wrong in getFileIcon`);
        }
    }
    
    showSection(sectionName, show = true) {
        if (this.elements[sectionName]) {
            this.elements[sectionName].style.display = show ? 'block' : 'none';
        }
    }
    
    updateButtonState(disabled = false, text = '') {
        this.elements.uploadBtn.disabled = disabled;
        if (text) {
            this.elements.uploadBtn.innerHTML = text;
        }
    }
    
    updateProgress(fileName, step, progress) {
        const bar = document.getElementById(`${step}-bar-${fileName}`);
        const percent = document.getElementById(`${step}-percent-${fileName}`);
        if (bar && percent) {
            bar.style.width = `${progress}%`;
            percent.textContent = `${Math.round(progress)}%`;
        }
    }
    
    createCompletedFileItem(file, message, color, secondaryColor, showRemove = false, onRemoveClick = null) {
        const fileHeader = document.createElement('div');
        fileHeader.className = 'file-header';
        fileHeader.style.borderLeft = `4px solid ${color}`;
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileIconDiv = document.createElement('div');
        fileIconDiv.className = 'file-icon';
        fileIconDiv.style.backgroundColor = secondaryColor;
        fileIconDiv.style.color = color;
        
        const icon = document.createElement('i');
        icon.className = this.getFileIcon(file.name);
        fileIconDiv.appendChild(icon);
        
        const fileDetails = document.createElement('div');
        fileDetails.className = 'file-details';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.style.color = color;
        fileName.textContent = file.name;
        
        const fileMessage = document.createElement('div');
        fileMessage.className = 'file-size';
        fileMessage.textContent = message;
        
        fileDetails.appendChild(fileName);
        fileDetails.appendChild(fileMessage);
        fileInfo.appendChild(fileIconDiv);
        fileInfo.appendChild(fileDetails);
        fileHeader.appendChild(fileInfo);
        
        if (showRemove && onRemoveClick) {
            const fileRemove = document.createElement('div');
            fileRemove.className = 'file-remove';
            fileRemove.addEventListener('click', onRemoveClick);
            
            const removeIcon = document.createElement('i');
            removeIcon.className = 'fas fa-times';
            fileRemove.appendChild(removeIcon);
            fileHeader.appendChild(fileRemove);
        } else {
            const checkmarkContainer = document.createElement('div');
            checkmarkContainer.style.color = color;
            const checkmark = document.createElement('i');
            checkmark.className = 'fas fa-check-circle';
            checkmarkContainer.appendChild(checkmark);
            fileHeader.appendChild(checkmarkContainer);
        }
        
        return fileHeader;
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}


class FileProcessor {
    constructor(domManager) {
        this.dom = domManager;
        this.files = [];
        this.fileDictionary = new Map();
        this.totalSizeValue = 0;
        this.processingActive = false;
        this.activeUploads = 0;
        this.uploadQueue = [];
        this.supportedExtensions = ["las","laz","pcd","pdf","mp4","txt"];
        this.pubsub_client_list = [];
        this.status_dypes = ["upload","process","store"];

    }

    /** START : All THE APIs */
    async startProcessing() {
        if (this.files.length === 0) return;
        
        this.processingActive = true;
        this.dom.updateButtonState(true, '<i class="fas fa-spinner fa-spin"></i> Processing Files...');
        this.uploadQueue = [...this.files];

        // Loop Through all the files
        const CONCURRENT_UPLOADS = 3;
        
        for (let i = 0; i < this.files.length; i += CONCURRENT_UPLOADS) {
            const batch = this.files.slice(i, i + CONCURRENT_UPLOADS);
            const batchPromises = batch.map(file => 
                this.processFile(file).finally(() => {
                    this.activeUploads--;
                })
            );
            
            await Promise.all(batchPromises);
        }
        // const initialCount = this.uploadQueue.length;
        // for (let i = 0; i < initialCount; i++) {
        //     const file = this.uploadQueue[i]
        //     await this.processFile(file).finally(() => {
        //         this.activeUploads--;
        //     });
        // }
        this.dom.showSection('uploadBtn', false);
    }
    
    async processFile(file) {
        try {
            // Upload to Azure
            await this.uploadToAzure(file);
        } catch (error) {
            this.markFileAsError(file, `Upload Error : ${error.message}`);
        }
        // Listens to the Processing and Storing
        const processResult = await this.callProcessFunction(file);          
    }

    /**const ONE_MB = 1_048_576;
blobServiceClient.uploadData(data), {
    onProgress: (progress) => handleUploadProgress(progress.loadedBytes),
    maxSingleShotSize: 4 * ONE_MB,
}); */
    /** ===== Start : Upload ========== */
    async uploadToAzure(file) {       
        try {
            console.log(`File Being sent to backend Nodejs... \n[filename ${file.name}, GB: ${this.filesizeInGB(file)}]`)
            const response = await fetch('/api/getBlobToken2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    filename: file.name, 
                    gb : this.filesizeInGB(file)
                })
            });
            if (response.ok) {
                const response_json = await response.json();
                
                const sas_url = response_json.sas_url;
                const container_name = response_json.container_name;
                const blob_name = response_json.blob_name;

                const blobServiceClient = new BlobServiceClient(sas_url);
                const containerClient = blobServiceClient.getContainerClient(container_name);
                const blockBlobClient = containerClient.getBlockBlobClient(blob_name);
                
                const ONE_MB = 1_048_576;
                await blockBlobClient.uploadData(file, {
                    onProgress: (progress) => {
                        const percent = Math.round((progress.loadedBytes / file.size) * 100);
                        console.log(`Progress: ${percent}%`);
                        this.dom.updateProgress(file.name, 'upload', percent);
                    },
                    maxSingleShotSize: 1 * ONE_MB,
                });
            } else {
                console.error('Upload failed:', response.error);
                this.markFileAsError(file, `Upload Error: ${response.error}`);
            }

            return true;
            
        } catch(error) {
            this.markFileAsError(file, `Upload Error: ${error.message}`);
            return false;
        }
    }
    /** ===== END: Upload ========== */


    /** ===== Start : Process & Store ========== */
    async callProcessFunction(file, n_retries=0) {
        try{
            // Start processing
            const response = await fetch('/api/getTokenPubSub', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    filename: file.name
                })
            });

            if (response.ok) {
                const data = await response.json();
                const url_token = data.url_token;
                const group_name = data.group_name;

                console.log(`Filename is [${file.name}] Groupname is ${group_name}`)
                await this.listenToProgressEvents(file, group_name, url_token);
                return true;
            }
            else{
                console.warn(response);
                if (n_retries > 3){
                    if (!response_json["message"] != null){
                        this.markFileAsError(file.name, `Processing Error : ${response_json["message"]}`);
                    }
                    this.markFileAsError(file.name, `Processing Error : Azure Functions Server Down, Good job Azure`);
                }
                await this.delay(5000);
                return await this.callProcessFunction(file, n_retries++);
            }
        }
        catch (error){
            this.markFileAsError(file.name, `Processing Error : ${error.message}`);
            return false;
        }
    }

    async listenToProgressEvents(file, group_name, getClientAccessUrl) {
        try{
            // Init Client
            const client_obj = new WebPubSubClient({ getClientAccessUrl });
            client_obj.on("connected", (e) => {
                console.log(group_name, `✅ Connected: ${e.connectionId}`);
            });
            client_obj.on("disconnected", (e) => {
                console.log(group_name, `🔴 Disconnected: ${e.message}`);
            });
            client_obj.on("group-message", (e) => {
                if (e.message.data instanceof ArrayBuffer) {
                    const msg_string = `Received string message from ${e.message.group} ${Buffer.from(e.message.data).toString("base64")}`;
                    console.log(msg_string);
                    console.log(group_name, msg_string);
                } else { // It's an object, Perfect, this is what we want
                    const msg_string = `Received json message from ${e.message.group} ${JSON.stringify(e.message.data)}`;
                    console.log(msg_string);
                    console.log(group_name, msg_string);
                    //const json_msg = JSON.parse(e.message.data);
                    const json_msg = e.message.data;
                    const status     = json_msg["status"]; // upload, process, store
                    const percentage = json_msg["percentage"];
                    const completion = json_msg.completed === "true" || json_msg.completed === true;
                    const hasError = json_msg.has_error === "true" || json_msg.has_error === true;
                    const error_msg  = json_msg["error_message"];
                    console.log(`Received json message`);
                    if (this.status_dypes.includes(status)){
                        if (hasError){
                            console.log(`error occured\n\n\n in ${file}, ${file.name}`);
                            this.markFileAsError(file, `${status} Error :${error_msg}`);
                            client_obj.stop()
                            return;
                        }
                        
                        if (completion && status === "store"){
                            const tree_count = json_msg["tree_count"];
                            console.log(tree_count);
                            this.delay(5000);
                            this.markFileAsCompleted(file, tree_count);
                            client_obj.stop()
                            return;
                        }
                        console.info(`Good status ${status}`);
                        this.dom.updateProgress(file.name, status, percentage);
                    }
                    else{
                        console.error(`Wrong Status ${status}`);
                    }
                }
            });
            await client_obj.start(); // Connects to the service
            await client_obj.joinGroup(group_name);
            this.pubsub_client_list.push(client_obj);
        }catch(error){
            this.markFileAsError(file.name, `Listening Error: ${error.message}`);
        }
    }
    /** ===== END: Process & Store ========== */


    /** END : All THE APIs */

    handleFiles(newFiles) {
        if (this.processingActive) {
            this.dom.showNotification("Please wait for current processing to complete", "error");
            return;
        }
        
        const validFiles = Array.from(newFiles).filter(file => this.validateFile(file));
        
        if (validFiles.length > 0) {
            validFiles.forEach(file => {
                this.files.push(file);
                this.totalSizeValue += file.size;
                console.warn(`filename in handleFiles is ${file.name}`);
                const fileItem = this.dom.createFileItem(
                    file, 
                    this.dom.formatFileSize(file.size), 
                    this.dom.getFileIcon(file.name),
                    () => this.removeFile(file.name)
                );
                
                this.dom.elements.fileList.appendChild(fileItem);
                this.updateDictionary(file, fileItem);
            });
            
            this.updateUI();
        }
    }
    
    validateFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const supportedExtensions = this.supportedExtensions;
        
        if (!supportedExtensions.includes(extension)) {
            this.dom.showNotification(`File Extension ".${extension}" is not supported`, 'error');
            return false;
        }
        
        if (this.files.some(f => f.name === file.name && f.size === file.size)) {
            return false;
        }
        
        if (file.size > 20 * 1000 * 1024 * 1024) {
            this.dom.showNotification(`File "${file.name}" exceeds 20GB limit.`, 'error');
            return false;
        }
        
        // if (file.size < 1 * 1024 * 1024) {
        //     this.dom.showNotification(`File "${file.name}" is below 1MB limit.`, 'error');
        //     return false;
        // }
        
        return true;
    }
    filesizeInGB(file){
        try{
            return file.size/(1000*1024*1024);
        }
        catch(error){
            this.markFileAsError(file.name, `filesize Error: ${error.message}`);
        }
    }
    
    removeFile(fileName) {  
        const fileIndex = this.files.findIndex(f => f.name === fileName);
        if (fileIndex !== -1) {
            // Store the file before splicing to use in deleteDictionary
            const fileToRemove = this.files[fileIndex];
            this.totalSizeValue -= fileToRemove.size;
            this.files.splice(fileIndex, 1);
            this.deleteDictionary(fileToRemove); // Pass the actual file object
            this.updateUI();
        }
    }
    
    updateUI() {
        this.dom.updateSummary(this.files.length, this.totalSizeValue);
        this.dom.showSection('selectedFiles', this.files.length > 0);
        this.dom.showSection('uploadBtn', this.files.length > 0);
    }
    
    updateDictionary(file, node) {
        const filename = file.name;
        if (this.fileDictionary.has(filename)) {
            const nodeList = this.fileDictionary.get(filename);
            nodeList.push(node);
            this.fileDictionary.set(filename, nodeList);
        } else {
            this.fileDictionary.set(filename, [node]);
        }
    }
    
    deleteDictionary(file) {
        const filename = file.name;
        if (this.fileDictionary.has(filename)) {
            const nodeList = this.fileDictionary.get(filename);
            nodeList.forEach(node => node.remove());
            this.fileDictionary.delete(filename);
        }
    }
        
    markFileAsCompleted(file, result) {
        const fileItem = this.dom.createCompletedFileItem(
            file,
            `Success! ${result} trees detected`,
            '#2ecc71',
            '#e7f6e9',
            false
        );
        this.dom.elements.completedFilesList.appendChild(fileItem);
        this.dom.showSection('completedFiles', true);
    }
    
    markFileAsError(file, error) {
        const fileItem = this.dom.createCompletedFileItem(
            file,
            error,
            '#cc2e39',
            '#f6e7ee',
            true,
            () => this.removeFile(file.name)
        );
        this.dom.elements.errorReportList.appendChild(fileItem);
        this.dom.showSection('errorReport', true);
        this.dom.showNotification(error, 'error');
    }
    
    processingComplete() {
        this.processingActive = false;
        this.dom.updateButtonState(false, '<i class="fas fa-check-circle"></i> All Files Processed!');
        setTimeout(() => {
            this.dom.showSection('uploadBtn', false);
        }, 3000);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class FileUploader {
    constructor() {
        this.domManager = new UploadDOM();
        this.processor = new FileProcessor(this.domManager);
    }
    
    init() {
        const elements = this.domManager.init();
        this.bindEvents(elements);
    }
    
    bindEvents(elements) {
      
        // File input change
        elements.fileInput.addEventListener('change', (e) => {
            this.processor.handleFiles(e.target.files);
        });
        
        // Upload button
        elements.uploadBtn.addEventListener('click', () => {
            this.processor.startProcessing();
        });


        // Browse button & Drag n Drop
        elements.browseBtn.addEventListener('click', () => {
            elements.fileInput.click();
        });
        elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.dropZone.classList.add('dragover');
        });
        elements.dropZone.addEventListener('dragleave', () => {
            elements.dropZone.classList.remove('dragover');
        });
        elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                this.processor.handleFiles(e.dataTransfer.files);
            }
        });
    }
}

// Usage:
document.addEventListener('DOMContentLoaded', function() {
    const uploader = new FileUploader();
    uploader.init();
});
