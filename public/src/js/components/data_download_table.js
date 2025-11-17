// import { BlobServiceClient } from "@azure/storage-blob";

export class TableManager {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 0;
        this.selectedRow = null;
        this.pagination = null;
        this.preloadedPages = new Map(); // Store pre-loaded pages
        this.isSearchMode = false;
        this.currentSearchTerm = '';
        
        document.addEventListener('DOMContentLoaded', () => {
            this.setupTableSorting();
            this.loadPageWithPreload(1);
            this.setupPaginationListeners();
            this.setupSearch();
            this.setupFilters();
        });
    }
    setupPaginationListeners() {
        document.addEventListener('click', (e) => {
            // Page number buttons
            if (e.target.closest('#page-numbers') && e.target.tagName === 'BUTTON' && e.target.dataset.page) {
                this.loadPageWithPreload(parseInt(e.target.dataset.page));
            }
            
            // Previous button
            if (e.target.closest('#prev-btn') || e.target.id === 'prev-btn') {
                if (this.pagination?.has_previous) {
                    this.loadPageWithPreload(this.pagination.current_page - 1);
                }
            }
            
            // Next button
            if (e.target.closest('#next-btn') || e.target.id === 'next-btn') {
                if (this.pagination?.has_next) {
                    this.loadPageWithPreload(this.pagination.current_page + 1);
                }
            }
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

    // MOST IMPORTANT FUNCTION
    cr8orUpdateRow(table_row_dict, i, update) {
        const row = document.createElement('tr');
        row.id = `row_elem${i}`;
        
        const myOrder = ["id","filename","coordinates","processed_url","status", "date","size"];
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
                    // console.log(`id is here ${value}`);
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
                            link.innerHTML = '';
                            
                            // Rebuild the link with icon and classes
                            const icon = document.createElement('i');
                            const text = document.createTextNode(`${value}`);
                            
                            icon.className = 'fas fa-file file-icon2';
                            link.appendChild(icon);
                            link.appendChild(text);
                            
                            link.href = '#';
                            link.className = 'view-logs2';
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
                            cell_update.setAttribute('filename', table_row_dict["filename"]);
                            cell_update.setAttribute('blob_folder', value);
                            cell_update.setAttribute('container_name', table_row_dict["sas_token"]["container_name"])
                            cell_update.setAttribute('processed_url',  table_row_dict["processed_url"])
                        }
                    } else {
                        const link = document.createElement('a');
                        const icon = document.createElement('i');
                        const text = document.createTextNode(' Download');
                        link.setAttribute('filename', table_row_dict["filename"]);
                        link.setAttribute('blob_folder', value);
                        link.setAttribute('container_name', table_row_dict["sas_token"]["container_name"])
                        link.setAttribute('processed_url',  table_row_dict["processed_url"])
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
                    // console.log(`error is ${hasError} ${table_row_dict.error}`);
                    if (update){
                        const cell_update = document.getElementById(`td_span_${key}${i}`);
                        if (cell_update){
                            cell_update.textContent = value;
                            if (hasError){
                                cell_update.className = `status error`;
                                // console.log(`error is True ${hasError}`);
                            } else {
                                cell_update.className = `status completed`;
                            }
                        }
                    } else {
                        const span = document.createElement('span');
                        span.id = `td_span_${key}${i}`;
                        if (hasError){
                            span.className = `status error`;
                            // console.log(`error is True ${hasError}`);
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
                        // if (link){
                        //     link.href = `${value}`;
                        // }
                    } else {
                        try {
                            const link = document.createElement('a');
                            const icon = document.createElement('i');
                            const text = document.createTextNode(' View Logs');
                            link.id = `td_link_${key}${i}`;
                            // link.href = '#';
                            link.className = 'view-logs2';
                            icon.className = 'fas fa-list';
                            link.appendChild(icon);
                            link.appendChild(text);
                            cellContent = link;
                        }
                        catch (exeption){
                            console.log(`logs_url`);
                        }

                    }
                    break;
                case "date":
                    if (update){
                        const cell_update = document.getElementById(`td_${key}${i}`);
                        if (cell_update){cell_update.textContent = this.dateToHumanReadable(value);}
                    } else {
                        cellContent = this.dateToHumanReadable(value) || 'Today, 11:23 AM';
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

    async if_RowSelectedDisplayImages(event, rowIndex, rowData) {
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
        
        const n_image = rowData.sideImages.length
        for (let i = 1; i <= n_image; i++) {
            await this.displayImageFromAzure(rowData.sideImages[i-1], `img-${i}`, 200, 300);
        }
        await this.displayImageFromAzure(rowData.topImage, `img-top`, 600,300);

    }

    async displayImageFromAzure(imgUrl, img_id, w, h) {
        try {
            const imgEl = document.getElementById(img_id);
            // Assign to your target image
            imgEl.src = imgUrl;
            imgEl.width = w;
            imgEl.height = h;

            console.log(`✅ Loaded & resized ${img_id}`);
        } catch (error) {
            console.error(`💥 displayImageFromAzure error for ${img_id}:`, error);
        }
    }


    dateToHumanReadable(dateString) {
        const dateObj = new Date(dateString);
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const inputDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        
        const diffDays = Math.floor((today - inputDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return `Today, ${timeFormatter.format(dateObj)}`;
        if (diffDays === 1) return `Yesterday, ${timeFormatter.format(dateObj)}`;
        
        return timeFormatter.format(dateObj); // Or any other format
    }

    async renderTable(table_data_json) {
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
        for (let i = 0; i < 5; i++) {
            let rowElement = document.getElementById(`row_elem${i}`);
            
            if (i < table_data_json.length) {
                // Has data for this row
                const row_data = table_data_json[i];
                
                if (rowElement) {
                    this.cr8orUpdateRow(row_data, i, true);
                } else {
                    rowElement = this.cr8orUpdateRow(row_data, i, false);
                    tbody.appendChild(rowElement);
                }
                rowElement.onclick = async (event) => await this.if_RowSelectedDisplayImages(event, i, row_data);
                rowElement.classList.remove('active');
                
                if (row_data.status === "Completed") {
                    rowElement.classList.remove('disabled');
                    const downloadBtn = rowElement.querySelector('.download-btn');
                    if (downloadBtn) {
                        downloadBtn.disabled = false;
                        downloadBtn.style.pointerEvents = 'auto';
                        downloadBtn.style.opacity = '1';
                    }
                } else {
                    rowElement.classList.add('disabled');
                    const downloadBtn = rowElement.querySelector('.download-btn');
                    if (downloadBtn) {
                        downloadBtn.disabled = true;
                        downloadBtn.style.pointerEvents = 'none';
                        downloadBtn.style.opacity = '0.5';
                    }
                }
            } else {
                // No data for this row - clear existing content
                if (rowElement) {
                    rowElement.remove();
                }
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


    /**########## PRELOAD PAGES!! ##############*/
    async loadPageWithPreload(page) {
        // console.log(`📄 Loading page ${page}`);
        
        // Check if page is pre-loaded
        if (this.preloadedPages.has(page)) {
            console.log(`⚡ Using pre-loaded page ${page}`);
            const data = this.preloadedPages.get(page);
            await this.displayPageData(data);
        } else {
            // Load page normally
            try {
                console.log(`🐢 Loading new-page from Az Server ${page}`);
                const response = await fetch(`/api/getQueries/${page}`);
                const data = await response.json();
                await this.displayPageData(data);
            }
            catch (error){
                console.log(`LoadPage API [getQueries] is sleeping, Azure Problem, Error: [${error}]`);
            }
        }
        
        // Pre-load next 2 pages when on page 1
        if (page === 1) {
            this.preloadPages([2, 3]);
        }
        // Pre-load surrounding pages for other pages
        else {
            this.preloadAdjacentPages(page);
        }
    }
    
    async preloadPages(pages) {
        console.log(`🔮 Pre-loading pages: ${pages.join(', ')}`);
        
        pages.forEach(page => {
            if (!this.preloadedPages.has(page)) {
                fetch(`/api/getQueries/${page}`)
                    .then(r => r.json())
                    .then(data => {
                        this.preloadedPages.set(page, data);
                        console.log(`✅ Pre-loaded page ${page}`);
                    })
                    .catch(err => console.error(`❌ Failed to pre-load page ${page}:`, err));
            }
        });
    }
    
    preloadAdjacentPages(currentPage) {
        const pagesToPreload = [];
        
        // Pre-load next 2 pages
        for (let i = 1; i <= 2; i++) {
            const nextPage = currentPage + i;
            if (nextPage <= this.totalPages && !this.preloadedPages.has(nextPage)) {
                pagesToPreload.push(nextPage);
            }
        }
        
        // Pre-load previous page if not too far back
        if (currentPage > 1 && !this.preloadedPages.has(currentPage - 1)) {
            pagesToPreload.push(currentPage - 1);
        }
        
        if (pagesToPreload.length > 0) {
            this.preloadPages(pagesToPreload);
        }
    }
    
    async displayPageData(data) {
        this.currentPage = data.pagination.current_page;
        this.totalPages = data.pagination.total_pages;
        this.pagination = data.pagination;
        
        await this.renderTable(data.items);
        this.renderPagination(data.pagination);
    }
    /**##############    END    ########################*/
    /**############# PRELOAD PAGES #####################*/
    /**##############    END    #########################*/


    /**#################################################*/
    /**############# SEARCH PAGES #####################*/
    /**#################################################*/
    setupSearch() {
        const searchInput = document.querySelector('.search-box input');
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (term.length === 0) {
                this.clearSearch();
                return;
            }
            
            if (term.length < 2) return;
            
            searchTimeout = setTimeout(() => {
                this.searchQueries(term);
            }, 300);
        });
    }
    
    searchQueries(searchTerm) {
        console.log(`🔍 Searching for: "${searchTerm}" in pre-loaded pages`);
        this.isSearchMode = true;
        this.currentSearchTerm = searchTerm;
        
        const allItems = [];
        
        // Collect all items from pre-loaded pages
        for (const [pageNum, pageData] of this.preloadedPages) {
            allItems.push(...pageData.items);
        }
        
        // Search through filename, status, and other fields
        const filteredItems = allItems.filter(item => 
            item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.tags && item.tags.some(tag => 
                tag.toLowerCase().includes(searchTerm.toLowerCase())
            ))
        );
        
        console.log(`✅ Found ${filteredItems.length} results in pre-loaded data`);
        this.renderSearchResults(filteredItems, searchTerm);
    }
    
    renderSearchResults(items, searchTerm) {
        const tbody = document.getElementById('id_table_body');
        tbody.innerHTML = '';
        
        if (items.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8">No results found for "${searchTerm}" in loaded data</td>`;
            tbody.appendChild(row);
        } else {
            // Render all search results
            items.forEach((item, index) => {
                const rowElement = this.cr8orUpdateRow(item, index, false);
                tbody.appendChild(rowElement);
            });
        }
        
        // Update search indicator (you might want to add this to your HTML)
        this.updateSearchIndicator(searchTerm, items.length);
    }
    
    updateSearchIndicator(searchTerm, resultCount) {
        // Create or update search indicator
        let indicator = document.querySelector('.search-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'search-indicator';
            document.querySelector('.search-box').appendChild(indicator);
        }
        
        indicator.textContent = `"${searchTerm}" - ${resultCount} results`;
        indicator.style.color = resultCount === 0 ? '#ff4444' : '#22c55e';
    }
    
    clearSearch() {
        this.isSearchMode = false;
        this.currentSearchTerm = '';
        
        // Remove search indicator
        const indicator = document.querySelector('.search-indicator');
        if (indicator) indicator.remove();
        
        // Return to normal paginated view
        this.loadPageWithPreload(this.currentPage);
    }



    setupFilters() {
        const statusFilter = document.querySelector('.filter-group select:nth-child(1)');
        const timeRangeFilter = document.querySelector('.filter-group select:nth-child(2)');
        
        statusFilter.addEventListener('change', (e) => {
            this.currentStatus = e.target.value;
            this.applyFilters();
        });
        
        timeRangeFilter.addEventListener('change', (e) => {
            this.currentTimeRange = e.target.value;
            this.applyFilters();
        });
    }
    
    applyFilters() {
        console.log('🔍 Applying separate filters:', {
            search: this.currentSearchTerm,
            status: this.currentStatus,
            timeRange: this.currentTimeRange
        });
        
        const allItems = this.getAllPreloadedItems();
        let filteredItems = allItems;
        
        // Apply each filter independently - no mixing logic
        filteredItems = this.applySearchFilter(filteredItems);
        filteredItems = this.applyStatusFilter(filteredItems);
        filteredItems = this.applyTimeRangeFilter(filteredItems);
        
        console.log(`✅ ${filteredItems.length} items after filtering`);
        this.renderFilteredResults(filteredItems);
    }
    getAllPreloadedItems() {
        const allItems = [];
        for (const [pageNum, pageData] of this.preloadedPages) {
            allItems.push(...pageData.items);
        }
        return allItems;
    }
    
    applyStatusFilter(items) {
        const status = this.currentStatus.toLowerCase();
        
        switch(status) {
            case 'all status':
                return items;
            case 'completed':
                return items.filter(item => 
                    item.status.toLowerCase().includes('completed') ||
                    item.status.toLowerCase().includes('replaced')
                );
            case 'processing':
                return items.filter(item => item.status.toLowerCase().includes('process'));
            case 'error':
                return items.filter(item => item.status.toLowerCase().includes('error'));
            default:
                return items;
        }
    }
    
    applyTimeRangeFilter(items) {
        if (this.currentTimeRange === 'All Time') {
            return items;
        }
        
        const now = new Date();
        let cutoffDate;
        
        switch(this.currentTimeRange) {
            case 'Last 24 Hours':
                cutoffDate = new Date(now - 24 * 60 * 60 * 1000);
                break;
            case 'Last 7 Days':
                cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'Last 30 Days':
                cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                return items;
        }
        
        return items.filter(item => {
            // Use your actual date key
            console.log(item);
            const itemDate = new Date(item.date);
            return itemDate >= cutoffDate;
        });
    }
    
    applySearchFilter(items) {
        if (!this.currentSearchTerm) {
            return items;
        }
        
        const searchTerm = this.currentSearchTerm.toLowerCase();
        return items.filter(item => 
            item.filename.toLowerCase().includes(searchTerm) ||
            (item.tags && item.tags.some(tag => 
                tag.toLowerCase().includes(searchTerm)
            ))
        );
    }
    
    renderFilteredResults(items) {
        const tbody = document.getElementById('id_table_body');
        tbody.innerHTML = '';
        
        if (items.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8">No matching items found</td>`;
            tbody.appendChild(row);
        } else {
            items.forEach((item, index) => {
                const rowElement = this.cr8orUpdateRow(item, index, false);
                tbody.appendChild(rowElement);
            });
        }
    }
    
    
    showResultCount(count) {
        const countEl = document.createElement('div');
        countEl.className = 'result-count';
        countEl.textContent = `${count} items`;
        countEl.style.cssText = 'font-size: 12px; color: #16a34a; margin-top: 4px; font-weight: bold;';
        document.querySelector('.filter-group').appendChild(countEl);
    }


}



// Initialize the table manager
export const tableManager = new TableManager();


