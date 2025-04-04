// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const resultSection = document.getElementById('resultSection');
const userData = document.getElementById('userData');
const copyButton = document.getElementById('copyButton');
const downloadButton = document.getElementById('downloadButton');
const processingIndicator = document.getElementById('processingIndicator');

// Update copyright year
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Handle clipboard paste events
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            processImage(blob);
            break;
        }
    }
});

// Drag and drop event handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'rgba(113, 137, 255, 0.2)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.backgroundColor = 'rgba(113, 137, 255, 0.1)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'rgba(113, 137, 255, 0.1)';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        processImage(file);
    }
});

// File input handler
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        processImage(file);
    }
});

// Process image with Tesseract OCR
async function processImage(file) {
    try {
        // Show result section and processing indicator
        resultSection.style.display = 'block';
        processingIndicator.style.display = 'flex';
        userData.value = '';

        // Create scheduler
        const scheduler = Tesseract.createScheduler();
        
        // Create workers
        const worker1 = await Tesseract.createWorker('eng');
        const worker2 = await Tesseract.createWorker('eng');
        
        // Add workers to scheduler
        scheduler.addWorker(worker1);
        scheduler.addWorker(worker2);

        // Initialize workers
        await worker1.loadLanguage('eng');
        await worker1.initialize('eng');
        await worker2.loadLanguage('eng');
        await worker2.initialize('eng');

        // Convert file to image URL
        const imageUrl = URL.createObjectURL(file);

        // Perform OCR
        const { data: { text } } = await scheduler.addJob('recognize', imageUrl);

        // Update text area with results
        userData.value = text;

        // Clean up
        URL.revokeObjectURL(imageUrl);
        await scheduler.terminate();
    } catch (error) {
        console.error('Error processing image:', error);
        userData.value = 'Error processing image. Please try again.';
    } finally {
        // Hide processing indicator
        processingIndicator.style.display = 'none';
    }
}

// Copy text to clipboard with visual feedback
copyButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(userData.value);
        
        // Update button state
        const originalContent = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="fas fa-check"></i> Copy Text';
        copyButton.classList.add('success');
        
        // Reset button state after 2 seconds
        setTimeout(() => {
            copyButton.innerHTML = originalContent;
            copyButton.classList.remove('success');
        }, 2000);
    } catch (error) {
        console.error('Error copying text:', error);
    }
});

// Download text file
downloadButton.addEventListener('click', () => {
    const text = userData.value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}); 