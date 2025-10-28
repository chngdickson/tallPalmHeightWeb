function arrayToCsv(data){
  return data.map(row =>
    row
    .map(String)  // convert every value to String
    .map(v => v.replaceAll('"', '""'))  // escape double quotes
    .map(v => `"${v}"`)  // quote it
    .join(',')  // comma-separated
  ).join('\r\n');  // rows starting on new lines
}

// Example
let csv = arrayToCsv([
  [1, '2', '"3"'],
  [true, null, undefined],
]);


// Downloading csv func
function downloadBlob(content, filename, contentType) {
  // Create a blob
  var blob = new Blob([content], { type: contentType });
  var url = URL.createObjectURL(blob);

  // Create a link to download it
  var pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', filename);
  pom.click();
}

// Download example
downloadBlob(csv, 'export.csv', 'text/csv;charset=utf-8;')


// Upload to CSV
async function uploadCsvToAzure(csvContent, fileName) {
  const blobUrl = `${sasUrl}/container-name/${fileName}`;
  
  await fetch(blobUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/csv',
      'x-ms-blob-type': 'BlockBlob'
    },
    body: csvContent
  });
}

// Usage:
const csvData = arrayToCsv(yourLogData);
await uploadCsvToAzure(csvData, 'logs/2024-01-15/session-123.csv');