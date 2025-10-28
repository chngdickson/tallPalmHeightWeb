export class TableManager {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 0;
        this.selectedRow = null;
        
        document.addEventListener('DOMContentLoaded', () => {
            this.setupTableSorting();
            this.loadPage(1);
            
        });
    }

    setupTableSorting() {
        document.querySelectorAll('th').forEach(header => {
            header.addEventListener('click', () => {
                const table = header.parentElement.parentElement.parentElement;
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                const index = Array.from(header.parentElement.children).indexOf(header);
                
                rows.sort((a, b) => {
                    const aValue = a.children[index].textContent;
                    const bValue = b.children[index].textContent;
                    return aValue.localeCompare(bValue);
                });
                
                while (tbody.firstChild) {
                    tbody.removeChild(tbody.firstChild);
                }
                
                rows.forEach(row => tbody.appendChild(row));
            });
        });
    }

    async loadPage(page) {           
        const response = await fetch(`/api/getQueries/${page}`);
        if (!response.ok) {
            throw new Error(`http Frontend Az Func error! status: ${response.status}`);
        }
        
        const data = await response.json();
        this.currentPage = data.pagination.current_page;
        this.totalPages = data.pagination.total_pages;
        
        this.renderTable(data.items);
        this.renderPagination(data.pagination);
    }

    renderTable(table_data_json) {
        const tbody = document.getElementById('id_table_body');
        
        if (table_data_json.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 8;
            cell.textContent = 'No table_data_json found';
            row.appendChild(cell);
            tbody.appendChild(row);
            return;
        }

        for (let i = 0; i < table_data_json.length; i++) {
            const row_data = table_data_json[i];
            let rowElement = document.getElementById(`row_elem${i}`);
            
            if (rowElement) {
                this.cr8orUpdateRow(row_data, i, true);
            } else {
                rowElement = this.cr8orUpdateRow(row_data, i, false);
                tbody.appendChild(rowElement);
            }
            
            rowElement.onclick = (event) => this.selectRow(event, i, row_data);
            rowElement.classList.remove('active');
            
            if (row_data.status === "Completed") {
                rowElement.classList.remove('disabled');
            } else {
                rowElement.classList.add('disabled');
            }
        }
    }

    cr8orUpdateRow(table_row_dict, i, update) {
        const row = document.createElement('tr');
        row.id = `row_elem${i}`;
        
        const myOrder = ["id","filename","coordinates","processed_url","status","logs_url", "date","size"];
        const sortedDict = {};
        myOrder.forEach(key => {
            if (key in table_row_dict) {
                sortedDict[key] = table_row_dict[key];
            }
        });
        
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
                    } else {
                        cellContent = `#${value || '1089'}`;
                    }
                    break;
                case "filename":
                    if (update){
                        const link = document.getElementById(`td_link_${key}${i}`);
                        if (link){
                            link.innerText = `${value}`;
                            link.href = value;
                            link.setAttribute('data-url', value);
                        }
                    } else {
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
                    break;
                case "coordinates":
                    if (update){
                        const cell_update = document.getElementById(`td_${key}${i}`);
                        if (cell_update){
                            cell_update.textContent = value;
                        }
                    } else {
                        cellContent = value || 'XYZ';
                    }
                    break;
                case "processed_url":
                    if (update){
                        const cell_update = document.getElementById(`td_span_${key}${i}`);
                        if (cell_update){
                            cell_update.href = value;
                            cell_update.setAttribute('data-url', value);
                        }
                    } else {
                        const link = document.createElement('a');
                        const icon = document.createElement('i');
                        const text = document.createTextNode(' Download');
                        link.href = value || '#';
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
                            } else {
                                cell_update.className = `status completed`;
                            }
                        }
                    } else {
                        const span = document.createElement('span');
                        span.id = `td_span_${key}${i}`;
                        if (hasError){
                            span.className = `status error`;
                            console.log(`error is True ${hasError}`);
                        } else {
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
                    } else {
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
                    } else {
                        cellContent = value || 'Today, 11:23 AM';
                    }
                    break;
                case "size":
                    if (update){
                        const cell_update = document.getElementById(`td_${key}${i}`);
                        if (cell_update){cell_update.textContent = value;}
                    } else {
                        cellContent = value || '120 / 3.2 GB';
                    }
                    break;
                default:
                    break;
            }

            if (update === false && cellContent != null){
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
        return row;
    }

    async selectRow(event, rowIndex, rowData) {
        if (rowData.status !== "Completed") {
            return;
        }

        const h1 = document.getElementById('clicked-file-id');
        h1.textContent = `Inspecting : ${rowData.filename}`;
        
        const rows = document.querySelectorAll('#id_table_body tr');
        rows.forEach(r => {
            r.classList.remove('selected');
            r.classList.remove('active');
        });
        event.currentTarget.classList.add('selected');
        event.currentTarget.classList.add('active');
        this.selectedRow = rowData;
        
        const img_ids = ["img-5"];
        rowData.images = ["https://picsum.photos/200/150?random=12"];
        await this.displayImages(rowData.images, img_ids);
    }

    async displayImages(imageUrls, imd_ids) {
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
                
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Failed to load image: ${imageUrl}`, error);
            }
        }
    }

    renderPagination(pagination) {
        const pageNumbers = document.getElementById('page-numbers');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        // Update previous/next buttons
        prevBtn.disabled = !pagination.has_previous;
        nextBtn.disabled = !pagination.has_next;
        
        // Generate page number buttons (max 4)
        const pageButtons = this.generatePageNumbers(pagination.current_page, pagination.total_pages, 3);
        pageNumbers.innerHTML = pageButtons.map(page => {
            if (page === '...') {
                return `<button disabled>...</button>`;
            }
            return `
                <button ${page === pagination.current_page ? 'style="font-weight: bold;"' : ''} 
                        data-page="${page}">
                    ${page}
                </button>
            `;
        }).join('');
        
        // Add event listeners for page buttons
        pageNumbers.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.page) {
                this.loadPage(parseInt(e.target.dataset.page));
            }
        });
        
        // Add event listeners for previous/next buttons
        prevBtn.onclick = () => pagination.has_previous && this.loadPage(pagination.current_page - 1);
        nextBtn.onclick = () => pagination.has_next && this.loadPage(pagination.current_page + 1);
    }

    // Generate sliding window page numbers
    generatePageNumbers(currentPage, totalPages, maxVisible = 4) {
        if (totalPages <= maxVisible) {
            return Array.from({length: totalPages}, (_, i) => i + 1);
        }
        
        const pages = [];
        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        // Adjust if we're near the end
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        // Add first page and ellipsis if needed
        if (start > 1) {
            pages.push(1);
            if (start > 2) {
                pages.push('...');
            }
        }
        
        // Add middle pages
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        // Add last page and ellipsis if needed
        if (end < totalPages) {
            if (end < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }
        
        return pages;
    }

    // Update page information
    updatePageInfo(pagination) {
        const info = document.getElementById('page-info');
        info.textContent = `Page ${pagination.current_page} of ${pagination.total_pages} (${pagination.total_items} total table_data_json)`;
    }

    setupPaginationEvents() {
        document.getElementById('prev-btn').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.loadPage(this.currentPage - 1);
            }
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.loadPage(this.currentPage + 1);
            }
        });
    }
}

// Initialize the table manager
export const tableManager = new TableManager();


