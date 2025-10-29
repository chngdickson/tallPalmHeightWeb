// downloadHandler.js
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('id_table_body').addEventListener('click', async (e) => {
        if (e.target.closest('.download-btn')) {
            console.log('Download button clicked!');
            e.preventDefault();
            const fileName = e.target.closest('tr').querySelector('td:nth-child(2)').textContent.trim();
            const downloadBtn = e.target.closest('.download-btn');
            const row = downloadBtn.closest('tr');
            const rowId = row.id.replace('row_elem', '');
            
            // Get the actual download URL from your data
            const downloadUrl = downloadBtn.getAttribute('data-url') || 
                            downloadBtn.href || 
                            downloadBtn.textContent;
            await downloadallBlobZipProgress("tph-files")
        }
    });
    document.querySelector('.export-btn').addEventListener('click', () => {
        alert('Data export started. You will receive an email when it is ready.');
    });
});

function createZip(id){
    const container = document.getElementById("zip-popup");
    if (!container){
        console.error("No container #zip-popup-id found");
        return { ok:false, title:null, percentText:null, bar:null }
    }
    else{
        container.style.display = "block";
        const textOuter = document.createElement("div");
        textOuter.className = "text-outer";
        const title = document.createElement("span");
        title.id = `id-bar-text-${id}`;
        title.textContent = `Preparing to download ${id}`;
        const percent = document.createElement("span");
        percent.id = `id-bar-percent-${id}`;
        percent.textContent = "0%";
        textOuter.appendChild(title);
        textOuter.appendChild(percent);
        const barOuter = document.createElement("div");
        const barInner = document.createElement("div");
        barInner.id = `id-bar-inner-${id}`;
        barOuter.className = "bar-outer";
        barInner.className = "bar-inner";
        barOuter.appendChild(barInner);
        container.appendChild(textOuter);
        container.appendChild(barOuter);
        return { ok:true, 
            title:document.getElementById(`id-bar-text-${id}`), 
            percentText:document.getElementById(`id-bar-percent-${id}`), 
            bar:document.getElementById(`id-bar-inner-${id}`) };
    }
};

async function downloadallBlobZipProgress(foldername){
    let socket = null;
    let chunks = [];
    let percentage = 0; 
    const prog = createZip(foldername);
    try{
        socket = io();
        socket.on('connect', () => {console.log('✅ Connected to server');});
        socket.on('connect_error', (error) => {console.error('❌ Connection failed:', error); alert("Connect Error during downloading!");});
        socket.on('zipping-progress', (data) => {
            // console.log('Progress received:', data);
            if (!prog.ok){alert("Hey, we got DOM error while downloading!");}
            
            percentage = data.percent.toFixed(1);
            if (prog.ok && data.stage ==="init"){
                prog.bar.style.width = `${percentage}%`;
                prog.percentText.textContent = `${percentage}%`;
                prog.title.textContent = `Azure Init [${foldername}]...`;
            }
            if (prog.ok && data.stage==="zipping"){
                prog.bar.style.width = `${percentage}%`;
                prog.percentText.textContent = `${percentage}%`;
                if (percentage < 90){
                    prog.title.textContent = `Zipping [${foldername}]...`;
                }else if(percentage > 90 && percentage < 95){
                    prog.title.textContent = `Finalizing ZIP...`;
                }
                else{
                    prog.bar.style.width = `100%`;
                    prog.percentText.textContent = `100%`;
                    prog.title.textContent = `Ready to Download ✅`;
                }
            }
        });
        socket.on("zipChunk", base64Chunk => {
            chunks.push(Uint8Array.from(atob(base64Chunk), c => c.charCodeAt(0)));
        });
        socket.emit('download-zip', { 
            foldername: foldername
        }, (response) => {
            if (!response.ok) {
                throw new Error('Download failed');
            }
            const blob = new Blob(chunks, { type: "application/zip" });
            const url = window.URL.createObjectURL(blob);
            
            // Trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'all-files.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // Disconnect Socket upon completion
            socket.disconnect();
        });
    } catch (error) {
        if (socket) {socket.disconnect();}
        console.error('Download error:', error);
    }
};