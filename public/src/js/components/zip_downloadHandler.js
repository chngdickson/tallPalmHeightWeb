import { 
    BlockBlobClient,
} from '../../../dist/bundle.js';

// downloadHandler.js
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('id_table_body').addEventListener('click', async (e) => {
        if (e.target.closest('.download-btn')) {
            console.log('Download button clicked!');
            e.preventDefault();
            const fileName_fromFilenameButton = e.target.closest('tr').querySelector('td:nth-child(2)').textContent.trim();
            const downloadBtn = e.target.closest('.download-btn');
            
            // const downloadUrl = downloadBtn.href; // Not Worth using the href, 
            let filename = downloadBtn.getAttribute('filename');
            let filetype = downloadBtn.getAttribute('filetype');
            let container_name = downloadBtn.getAttribute('container_name');
            let processed_url = downloadBtn.getAttribute('processed_url')
            console.log(`${filename} ${filetype} ${container_name} ${fileName_fromFilenameButton}`);
            await downloadBlobFromFrontend(filename, filetype, processed_url);
        }
    });
    document.querySelector('.export-btn').addEventListener('click', () => {
        alert('Data export started. You will receive an email when it is ready.');
    });
});

async function downloadBlobFromFrontend(filename, filetype, processed_url){
    try{
        const response = await fetch('/api/getDownloadToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                filename: filename,
                filetype : filetype,
                processed_url : processed_url
            })
        });
        if (!response.ok){throw new Error('Download failed');}
        const response_json = await response.json();
        console.log(response_json);
        const res_sas_token = response_json.sas_token;
        const res_filename = response_json.filename;
        downloadBlobWithIframe(res_sas_token, res_filename);

    } catch (error) {
        console.error('Download error:', error);
    }
}

async function downloadBlobWithIframe(sasUrl, filename){
    try{
        const iframe = document.createElement('iframe');
        iframe.id = "id_download_iframe";
        iframe.src = sasUrl;
        iframe.style.display = 'none';
        iframe.onload = function() {
            this.parentNode.removeChild(this);
        };
        document.body.appendChild(iframe);
    } catch (error) {
        console.error('Iframe Download error:', error);
    }
}