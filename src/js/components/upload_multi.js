// export function loadUploadComponent() {
//     fetch('../src/content/components/upload_multi.html')
//         .then(response => response.text())
//         .then(data => {
//             document.getElementById('upload-files').innerHTML = data;
//         })
//         .catch(error => console.error('Error loading footer:', error));
//   }

document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const selectedFiles = document.getElementById('selected-files');
    const fileList = document.getElementById('file-list');
    const filesCount = document.getElementById('files-count');
    const totalFiles = document.getElementById('total-files');
    const totalSize = document.getElementById('total-size');
    const processTime = document.getElementById('process-time');
    const completedFiles = document.getElementById('completed-files');
    const completedFilesList = document.getElementById('completed-files-list');
    const errorReport = document.getElementById('error-report');
    const errorReportList = document.getElementById('error-report-list');

    let files = [];
    const file_dictionary = new Map();
    let totalSizeValue = 0;
    let processingActive = false;
    let concurrencyLimit = 10;
    let activeUploads = 0;
    let uploadQueue = [];
    
    
    // Open file dialog when clicking the browse button
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop event handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    // Handle the upload button click
    uploadBtn.addEventListener('click', startProcessing);
    
    function handleFileSelect(e) {
        handleFiles(e.target.files);
    }
    
    function handleFiles(newFiles) {
        if (processingActive) {
            showNotification("Please wait for current processing to complete", "error");
            return;
        }
        
        if (newFiles.length > 0) {
            for (let i = 0; i < newFiles.length; i++) {
                const file = newFiles[i];
                
                // Check file extension
                const extension = file.name.split('.').pop().toLowerCase();
                var supportedExtensions = ["las","laz","pcd"];
                if (supportedExtensions.indexOf(extension) < 0) {
                    showNotification(`
                        File Extension ".${extension}" is not supported, 
                        Supported Filetypes are ${supportedExtensions}`, 
                        'error');
                    continue;
                }


                // Check if file already exists
                if (files.some(f => f.name === file.name && f.size === file.size)) {
                    continue;
                }
                
                // Check file size (max 100MB)
                if (file.size > 20 * 1000 * 1024 * 1024) {
                    showNotification(`File "${file.name}" exceeds 20GB limit.`, 'error');
                    continue;
                }
                if (file.size < 10 * 1024 * 1024) {
                    showNotification(`File "${file.name}" is below 10MB limit.`, 'error');
                    continue;
                }
            

                files.push(file);
                totalSizeValue += file.size;
                
                // Create file item UI
                const fileItem = createFileItem(file);
                fileList.appendChild(fileItem);
            }
            
            updateSummary();
            
            // Show selected files section
            selectedFiles.style.display = 'block';
            uploadBtn.style.display = 'block';
        }
    }
    
    function createFileItem(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.name = file.name;
        
        const fileSize = formatFileSize(file.size);
        const fileIcon = getFileIcon(file.name);
        
        // Create file header
        const fileHeader = document.createElement('div');
        fileHeader.className = 'file-header';
        
        // Create file info
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        // Create file icon
        const fileIconDiv = document.createElement('div');
        fileIconDiv.className = 'file-icon';
        const iconElement = document.createElement('i');
        iconElement.className = fileIcon;
        fileIconDiv.appendChild(iconElement);
        
        // Create file details
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
        
        // Assemble file info
        fileInfo.appendChild(fileIconDiv);
        fileInfo.appendChild(fileDetails);
        
        // Create remove button
        const fileRemove = document.createElement('div');
        fileRemove.className = 'file-remove';
        fileRemove.dataset.name = file.name;
        
        const removeIcon = document.createElement('i');
        removeIcon.className = 'fas fa-times';
        fileRemove.appendChild(removeIcon);
        
        // Assemble file header
        fileHeader.appendChild(fileInfo);
        fileHeader.appendChild(fileRemove);
        
        // Create processing pipeline
        const processingPipeline = document.createElement('div');
        processingPipeline.className = 'processing-pipeline';
        
        const pipelineTitle = document.createElement('div');
        pipelineTitle.className = 'pipeline-title';
        pipelineTitle.textContent = 'Processing Pipeline:';
        
        const pipelineSteps = document.createElement('div');
        pipelineSteps.className = 'pipeline-steps';
        
        // Create pipeline steps
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
            stepBar.id = `${step.name}-bar-${file.name}`;
            
            stepProgress.appendChild(stepBar);
            
            const stepPercentage = document.createElement('div');
            stepPercentage.className = 'step-percentage';
            stepPercentage.id = `${step.name}-percent-${file.name}`;
            stepPercentage.textContent = '0%';
            
            stepDiv.appendChild(stepTitle);
            stepDiv.appendChild(stepProgress);
            stepDiv.appendChild(stepPercentage);
            
            pipelineSteps.appendChild(stepDiv);
        });
            // Assemble processing pipeline
            processingPipeline.appendChild(pipelineTitle);
            processingPipeline.appendChild(pipelineSteps);
            
            // Assemble file item
            fileItem.appendChild(fileHeader);
            fileItem.appendChild(processingPipeline);
            updateDictionary(file, fileItem);
            // Add event listener for remove button
            fileRemove.addEventListener('click', () => {
                if (processingActive) {
                    showNotification("Cannot remove files during processing", "error");
                    return;
                }
                removeFile(file.name);
                deleteDictionary(file);
                // fileItem.remove();
            });
            
            return fileItem;
        }
    
    function removeFile(fileName) {
        const fileIndex = files.findIndex(f => f.name === fileName);
        if (fileIndex !== -1) {
            totalSizeValue -= files[fileIndex].size;
            files.splice(fileIndex, 1);
            updateSummary();
            
            if (files.length === 0) {
                selectedFiles.style.display = 'none';
                uploadBtn.style.display = 'none';
            }
        }
    }
    
    function updateSummary() {
        filesCount.textContent = `(${files.length})`;
        totalFiles.textContent = files.length;
        totalSize.textContent = formatFileSize(totalSizeValue);
        
        // Estimate processing time based on file sizes and concurrency
        const largestFileSize = files.length > 0 ? 
            Math.max(...files.map(file => file.size)) : 0;
        const estimatedTime = Math.round(largestFileSize / (1024 * 1024) * 0.3) + 2;
        processTime.textContent = `${estimatedTime}s`;
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        else return (bytes / 1048576).toFixed(2) + ' MB';
    }
    
    function getFileIcon(fileName) {
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
    
    function updateDictionary(file, node){
        const filename = file.name;
        if (file_dictionary.has(filename))
        {
            const node_list = file_dictionary.get(filename);
            node_list.push(node);
            console.log("adding",node_list);
            file_dictionary.set(filename, node_list);
        }
        else 
        {
            // let node_list = [node];
            const node_list = new Array(node);
            console.log(node_list);
            console.log("Initialization",node_list);
            file_dictionary.set(filename, node_list);
        }
    }

    function deleteDictionary(file)
    {
        const filename = file.name;

        if (file_dictionary.has(filename))
        {
            const node_list = file_dictionary.get(filename);
            console.log("Removal",node_list);
            for (const node of node_list) {
                node.remove();
            }
            removeFile(filename);
        }


    }
    function startProcessing() {
        if (files.length === 0) return;
        
        processingActive = true;
        
        // Disable the upload button during processing
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Files...';
        
        // Create upload queue
        uploadQueue = [...files];
        
        // Start processing with concurrency
        processWithConcurrency();
    }
    
    function processWithConcurrency() {
        // Start initial uploads up to the concurrency limit
        const initialCount = Math.min(concurrencyLimit, uploadQueue.length);
        for (let i = 0; i < initialCount; i++) {
            processNextFile();
        }
    }
    
    function processNextFile() {
        if (uploadQueue.length === 0 && activeUploads === 0) {
            // All files processed
            processingActive = false;
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-check-circle"></i> All Files Processed!';
            setTimeout(() => {
                uploadBtn.style.display = 'none';
            }, 3000);
            return;
        }
        
        if (uploadQueue.length > 0 && activeUploads < concurrencyLimit) {
            const file = uploadQueue.shift();
            activeUploads++;
            
            processFile(file, () => {
                activeUploads--;
                processNextFile();
            });
        }
    }
  
  
    async function processFile(file, callback) {
        const steps = ['upload', 'process', 'store'];
        const fileItem = document.querySelector(`.file-item[data-name="${file.name}"]`);
        const fileNameEl = fileItem.querySelector('.file-name');
        let shouldBreak = false;
        let upload_fail = false;
        let maxTime = 100;
        let processing_fail = false;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const randProcessTime = 1000 + Math.random() * 1000;
            
            // Random Failures lol
            if (i === 0){
                upload_fail = (Math.random() < 0.4);
                if (upload_fail){
                    maxTime = Math.random()*100;
                }
            }
            else if (i === 1){
                processing_fail = (Math.random() < 0.4);
                if (processing_fail){
                    maxTime = Math.random()*100;
                }
            }
            else if (shouldBreak) return;

            
            await processStep(file, step, 0, maxTime, randProcessTime, () => {});
            // setTimeout(() => {
                
            // }, i*randProcessTime);
            if (upload_fail){
                shouldBreak = true; //Break out of the loop
                addToErrorReport(file, `"Upload Failed! at ${Math.ceil(maxTime)}% Please Try again!"`);
                showNotification(`Upload Failed! at ${Math.ceil(maxTime)}% Please Try again!`, 'error')
                setTimeout(callback, 300);
                return;
            }
            else if (processing_fail){
                shouldBreak = true; //Break out of the loop
                addToErrorReport(file, `"Processing Failed! Error Message______.  Please contact support@groot-compute.com"`);
                showNotification(`Processing Failed! Please contact support@groot-compute.com`, 'error')
                setTimeout(callback, 300);
                return;
            }
            else if (i === steps.length-1){
                addToCompletedFiles(file, `Success! X Number of Trees Detected, please review at ____ data`);
                fileNameEl.style.color = '#2ecc71';
                fileItem.style.borderLeft = '4px solid #2ecc71';
                setTimeout(callback, 300);
                return;
            }
        }
        }
    
    
    async function processStep(file, step, start, end, duration, callback) {
        const bar = document.getElementById(`${step}-bar-${file.name}`);
        const percent = document.getElementById(`${step}-percent-${file.name}`);
        
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = start + (end - start) * Math.min(elapsed / duration, 1);
            
            // Update progress bar
            bar.style.width = progress + '%';
            percent.textContent = Math.round(progress) + '%';
            
            if (elapsed >= duration) {
                clearInterval(interval);
                callback();
            }
        }, 50);
    }
  
  
  
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    function addToCompletedFiles(file, message) {
        const fileSize = formatFileSize(file.size);
        const fileIcon = getFileIcon(file.name);
        
        const green_color = "#2ecc71"
        const green_color2 = "#e7f6e9"
        const fileItem = divErrorReport(file, message, green_color, green_color2, false);
        completedFilesList.appendChild(fileItem);
        completedFiles.style.display = 'block';
    }
    function addToErrorReport(file, error_type) {
        const red_color = "#cc2e39"
        const red_color2 = "#f6e7ee"
        const fileItem = divErrorReport(file, error_type, red_color, red_color2, true)    
        errorReportList.appendChild(fileItem);
        errorReport.style.display = 'block';

    }


    function divErrorReport(file, message, color, secondary_color, bool_file_remove){
        // Prerequisites
        const fileIcon = getFileIcon(file.name);


        const fileHeader = document.createElement('div');
        const fileInfo = document.createElement('div');
        fileHeader.className = 'file-header';
        fileHeader.style.borderLeft = `4px solid ${color}`;
        fileInfo.className = 'file-info';
        
        // Icons
        const fileIconDiv = document.createElement('div');
        fileIconDiv.className = 'file-icon';
        fileIconDiv.style.backgroundColor = secondary_color;
        fileIconDiv.style.color = color; 

        // icon element 
        const icon = document.createElement('i');
        icon.className = fileIcon; 
        fileIconDiv.appendChild(icon);

        // Create the file-details div
        const fileDetails = document.createElement('div');
        fileDetails.className = 'file-details';

        // Create the file-name div
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.style.color = color;
        fileName.textContent = file.name; // Assuming file object exists with name property

        // Create the file-size div
        const fileSize = document.createElement('div');
        fileSize.className = 'file-size';
        fileSize.textContent = message; 
        

        // Build the hierarchy
        fileDetails.appendChild(fileName);
        fileDetails.appendChild(fileSize);
        fileInfo.appendChild(fileIconDiv);
        fileInfo.appendChild(fileDetails);
        fileHeader.appendChild(fileInfo);


        //Create checkmark or no
        if (bool_file_remove){
            const fileRemove = document.createElement('div');
            fileRemove.className = 'file-remove';
            fileRemove.dataset.name = file.name;
            
            const removeIcon = document.createElement('i');
            removeIcon.className = 'fas fa-times';
            fileRemove.appendChild(removeIcon);

            fileHeader.appendChild(fileRemove);
            fileRemove.addEventListener('click', () => 
            {
                // removeFile(file.name);
                // fileHeader.remove();
                deleteDictionary(file);
            });
        }
        else {
            // Create the checkmark container div
            const checkmarkContainer = document.createElement('div');
            checkmarkContainer.style.color = color;

            // Create the checkmark icon
            const checkmark = document.createElement('i');
            checkmark.className = 'fas fa-check-circle';
            checkmarkContainer.appendChild(checkmark);
            fileHeader.appendChild(checkmarkContainer);
        }
        
        updateDictionary(file, fileHeader);
        return fileHeader
    }
});