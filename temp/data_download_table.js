// Table Sorting
document.querySelectorAll('th').forEach(header => {
    header.addEventListener('click', () => {
        const table = header.parentElement.parentElement.parentElement;
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const index = Array.from(header.parentElement.children).indexOf(header);
        
        rows.sort((a, b) => {
            const aValue = a.children[index].textContent;
            const bValue = b.children[index].textContent;
            
            // Simple string comparison for demo purposes
            return aValue.localeCompare(bValue);
        });
        
        // Remove existing rows
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        
        // Add sorted rows
        rows.forEach(row => tbody.appendChild(row));
    });
});



let currentPage = 1;
let totalPages = 0;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadPage(1);
});

// Load specific page
async function loadPage(page) {           
    // Replace with your actual API endpoint
    const response = await fetch(`/api/getQueries/${page}`);
    if (!response.ok) {
        throw new Error(`http Frontend Az Func error! status: ${response.status}`);
    }
    
    const data = await response.json();
    currentPage = data.pagination.current_page;
    totalPages = data.pagination.total_pages;
    
    renderTable(data.items);
    renderPagination(data.pagination);
}

function renderTable(table_data_json) {
    const tbody = document.getElementById('id_table_body');
    
    // No Result
    if (table_data_json.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 8;
        cell.textContent = 'No table_data_json found';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    // row.className = 'active';
    

    // Table
    for (let i = 0; i < table_data_json.length; i++) {
        const row_data = table_data_json[i];
        let rowElement = document.getElementById(`row_elem${i}`);
        // IF exists
        if(rowElement){
            // Update
            cr8orUpdateRow(row_data, i, update=true);
        }
        else{
            // Create and push
            rowElement = cr8orUpdateRow(row_data, i, update=false);
            tbody.appendChild(rowElement);
        }
        rowElement.onclick = (event) => selectRow(event, i, row_data);
        
        rowElement.classList.remove('active');
        // Visual styling based on status
        if (row_data.status === "Completed") {
            rowElement.classList.remove('disabled');
        } else {
            rowElement.classList.add('disabled');
        }
    }
    return;
}

function cr8orUpdateRow(table_row_dict, i, update){
    // Assume data_dict
    const row = document.createElement('tr');
    row.id=`row_elem${i}`;
    
    const myOrder = ["id","filename","coordinates","processed_url","status","logs_url", "date","size"];
    const sortedDict = {};
    myOrder.forEach(key => {
        if (key in table_row_dict) {
            sortedDict[key] = table_row_dict[key];
        }
    });
    outerLoop:
    for (const [key, value] of Object.entries(sortedDict)) {
        let cellContent;
        switch (key) {
            case "id":
                console.log(`id is here ${value}`)
                if (update){
                    const cell_update = document.getElementById(`td_${key}${i}`);
                    if (cell_update){
                        cell_update.textContent = `#${value}`;
                    }
                }
                else{
                    cellContent = `#${value || '1089'}`;
                }
                break
            case "filename": // UpdateFileLink
                if (update){
                    const link = document.getElementById(`td_link_${key}${i}`);
                    if (link){
                        link.innerText = `${value}`;
                        link.href = value; // Update URL
                        link.setAttribute('data-url', value); // Store URL in data attribute
                    }
                }
                else{
                    const link = document.createElement('a');
                    const icon = document.createElement('i');
                    const text = document.createTextNode(`${value}`);
                    link.id = `td_link_${key}${i}`;
                    link.href = '#';
                    link.className = 'view-logs2';
                    icon.className = 'fas fa-file file-icon2';
                    
                    link.appendChild(icon);
                    link.appendChild(text);
                    
                    cellContent = link;
                }
                break
            case "coordinates":
                if (update){
                    const cell_update = document.getElementById(`td_${key}${i}`);
                    if (cell_update){
                        cell_update.textContent = value;
                    }
                }
                else{
                    cellContent = value || 'XYZ';
                }
                break
            case "processed_url":
                if (update){
                    const cell_update = document.getElementById(`td_span_${key}${i}`);
                    if (cell_update){
                        // cell_update.textContent = value;
                        cell_update.href = value; // Update URL
                        cell_update.setAttribute('data-url', value); // Store URL in data attribute
                    }
                }
                else{
                    const link = document.createElement('a');
                    const icon = document.createElement('i');
                    const text = document.createTextNode(' Download');
                    link.href = value || '#'; // Use actual URL
                    link.id = `td_span_${key}${i}`;
                    link.className = 'download-btn';
                    icon.className = 'fas fa-download';
                    link.appendChild(icon);
                    link.appendChild(text);
                    
                    cellContent = link;
                }
                break;
            case "status":
                let hasError = table_row_dict.error === "True" || table_row_dict.error === true;
                console.log(`error is ${hasError} ${table_row_dict.error}`);
                if (update){
                    const cell_update = document.getElementById(`td_span_${key}${i}`);
                    if (cell_update){
                        cell_update.textContent = value;
                        if (hasError){
                            cell_update.className = `status error`;
                            console.log(`error is True ${hasError}`);
                        }
                        else{
                            
                            cell_update.className = `status completed`;
                        }
                    }
                }
                else{
                    const span = document.createElement('span');
                    span.id = `td_span_${key}${i}`;
                    if (hasError){
                        span.className = `status error`;
                        console.log(`error is True ${hasError}`);
                    }
                    else{
                        span.className = `status completed`;
                    }
                    span.textContent = value;
                    
                    cellContent = span;
                }
                break;
            case "logs_url":
                if (update){
                    const link = document.getElementById(`td_link_${key}${i}`);
                    if (link){
                        link.href = `${value}`;
                    }
                }
                else{
                    const link = document.createElement('a');
                    const icon = document.createElement('i');
                    const text = document.createTextNode(' View Logs');
                    link.id = `td_link_${key}${i}`;
                    link.href = '#';
                    link.className = 'view-logs2';
                    icon.className = 'fas fa-list';
                    link.appendChild(icon);
                    link.appendChild(text);
                    
                    cellContent = link;
                }
                break;
            case "date":
                if (update){
                    const cell_update = document.getElementById(`td_${key}${i}`);
                    if (cell_update){cell_update.textContent = value;}
                }
                else{
                    cellContent = value || 'Today, 11:23 AM';
                }
                break;
            case "size":
                if (update){
                    const cell_update = document.getElementById(`td_${key}${i}`);
                    if (cell_update){cell_update.textContent = value;}
                }
                else{
                    cellContent = value || '120 / 3.2 GB';
                }
                break;
            default:
                break;
            }

            if (update === false){
                if (cellContent != null){
                    const cell = document.createElement('td');
                    cell.id = `td_${key}${i}`;
                    if (typeof cellContent === 'string') {
                        cell.textContent = cellContent;
                    } else {
                        cell.appendChild(cellContent);
                    }
                    row.appendChild(cell);
                }
            } 
    }
    return row;
}

async function selectRow(event, rowIndex, rowData) {
    // Only allow selection if status is "Completed"
    if (rowData.status !== "Completed") {
        return;
    }

    const h1 = document.getElementById('clicked-file-id');
    h1.textContent = `Inspecting : ${rowData.filename}`;
    // Remove previous selection
    const rows = document.querySelectorAll('#id_table_body tr');
    rows.forEach(r => r.classList.remove('selected'));
    
    // Add selection to clicked row
    event.currentTarget.classList.add('selected');
    event.currentTarget.classList.add('active');
    selectedRow = rowData;
    const img_ids = ["img-5"];
    rowData.images = ["https://picsum.photos/200/150?random=12"];
    await displayImages(rowData.images, img_ids);
}

// TODO: 
// Download and display images with constant size
async function displayImages(imageUrls, imd_ids) {
    console.log(`display Images`);
    
    if (imageUrls.length === 0) {
        return;
    }
    
    for (const imageUrl of imageUrls) {
        try {
            const img = document.getElementById("img-5");
            if (img){
                console.log(`Loaded Image`);
                img.src = imageUrl;
            }
            
            // Small delay to avoid overwhelming requests
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Failed to load image: ${imageUrl}`, error);
        }
    }
}