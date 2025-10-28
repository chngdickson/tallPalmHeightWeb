function renderPagination(pagination) {
    const pageNumbers = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    // Update previous/next buttons
    prevBtn.disabled = !pagination.has_previous;
    nextBtn.disabled = !pagination.has_next;
    
    // Generate page number buttons (max 4)
    const pageButtons = generatePageNumbers(pagination.current_page, pagination.total_pages, 3);
    pageNumbers.innerHTML = pageButtons.map(page => {
        if (page === '...') {
            return `<button disabled>...</button>`;
        }
        return `
            <button ${page === pagination.current_page ? 'style="font-weight: bold;"' : ''} 
                    onclick="loadPage(${page})">
                ${page}
            </button>
        `;
    }).join('');
    
    // Add event listeners for previous/next buttons
    prevBtn.onclick = () => pagination.has_previous && loadPage(pagination.current_page - 1);
    nextBtn.onclick = () => pagination.has_next && loadPage(pagination.current_page + 1);
}

// Generate sliding window page numbers
function generatePageNumbers(currentPage, totalPages, maxVisible = 4) {
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
function updatePageInfo(pagination) {
    const info = document.getElementById('page-info');
    info.textContent = `Page ${pagination.current_page} of ${pagination.total_pages} (${pagination.total_items} total table_data_json)`;
}

// Event listeners for previous/next buttons
document.getElementById('prev-btn').addEventListener('click', function() {
    if (currentPage > 1) {
        loadPage(currentPage - 1);
    }
});

document.getElementById('next-btn').addEventListener('click', function() {
    if (currentPage < totalPages) {
        loadPage(currentPage + 1);
    }
});