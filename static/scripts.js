document.addEventListener("DOMContentLoaded", function() {
    const fileInput = document.getElementById("file");
    const pdfPreview = document.getElementById("pdf-preview");
    const pageSlider = document.getElementById("page-slider");
    const startPageCanvas = document.getElementById("start-page-canvas");
    const endPageCanvas = document.getElementById("end-page-canvas");
    const startPageInput = document.getElementById("start_page");
    const endPageInput = document.getElementById("end_page");
    const removeFileButton = document.getElementById("remove-file-button");
    const extractStartPageButton = document.getElementById("extract-start-page-button");
    const extractEndPageButton = document.getElementById("extract-end-page-button");
    const dropContainer = document.getElementById("dropcontainer");
    const errorMessage = document.createElement("div"); // Added for error handling
    errorMessage.id = "error-message"; // Added for error handling
    errorMessage.style.color = "red"; // Added for error handling
    errorMessage.style.display = "none"; // Added for error handling
    document.body.appendChild(errorMessage); // Added for error handling

    let pdfDoc = null;
    let selectedStartPage = null;
    let selectedEndPage = null;
    let uploadedFile = null;

    // Initial setup: Hide "Start Page" and "End Page" inputs
    hidePageInputs();

    // Existing event listeners
    fileInput.addEventListener("change", handleFileSelect);
    startPageInput.addEventListener("input", handleStartPageInput);
    endPageInput.addEventListener("input", handleEndPageInput);
    removeFileButton.addEventListener("click", handleRemoveFile);
    extractStartPageButton.addEventListener("click", handleExtractStartPage);
    extractEndPageButton.addEventListener("click", handleExtractEndPage);

    // Drag and drop event listeners
    dropContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    dropContainer.addEventListener("dragenter", () => {
        dropContainer.classList.add("drag-active");
    });

    dropContainer.addEventListener("dragleave", () => {
        dropContainer.classList.remove("drag-active");
    });

    dropContainer.addEventListener("drop", (e) => {
        e.preventDefault();
        dropContainer.classList.remove("drag-active");
        fileInput.files = e.dataTransfer.files;

        // Trigger change event on file input
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    });

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const fileReader = new FileReader();
            fileReader.onload = function(e) {
                const typedArray = new Uint8Array(e.target.result);
                pdfjsLib.getDocument(typedArray).promise.then(pdf => {
                    pdfDoc = pdf;
                    renderPageSlider(pdf);
                    // Show PDF preview and hide file input and drop container
                    pdfPreview.classList.remove("hidden");
                    dropContainer.classList.add("hidden");
                    // Show the buttons
                    document.getElementById("remove-file-button").style.display = "block";
                    document.getElementById("slice-pdf-button").style.display = "block";
                    showPageInputs();

                }).catch(error => {
                    console.error('Error loading PDF:', error);
                });
            };
            fileReader.readAsArrayBuffer(file);
        } else {
            displayError("Please upload a valid PDF file."); // Added for error handling
            handleRemoveFile(); // Added for error handling
        }
    }

    function displayError(message) { // Added for error handling
        errorMessage.textContent = message; // Added for error handling
        errorMessage.style.display = "block"; // Added for error handling
        setTimeout(() => { // Added for error handling
            errorMessage.style.display = "none"; // Added for error handling
        }, 5000); // Added for error handling
    }

    function renderPageSlider(pdf) {
        pageSlider.innerHTML = "";
        const pageRenderPromises = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            pageRenderPromises.push(
                pdf.getPage(pageNum).then(page => {
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    const viewport = page.getViewport({ scale: 0.2 });
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    canvas.dataset.pageNum = pageNum;

                    return page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise.then(() => {
                        return canvas;
                    });
                })
            );
        }

        Promise.all(pageRenderPromises).then(canvases => {
            canvases.forEach(canvas => {
                pageSlider.appendChild(canvas);
                canvas.addEventListener("click", handlePageClick);
            });
        });

        pdfPreview.classList.remove("hidden");
    }

    function handlePageClick(event) {
        const clickedPageNum = parseInt(event.target.dataset.pageNum);

        if (selectedStartPage === null) {
            // Set start page if not selected
            selectedStartPage = clickedPageNum;
        } else if (selectedStartPage === clickedPageNum) {
            // Unselect start page if clicked again
            selectedStartPage = null;
        } else if (selectedEndPage === null) {
            // Set end page if start page is selected and end page is not set
            selectedEndPage = clickedPageNum;
            if (selectedStartPage > selectedEndPage) {
                // Swap start and end pages to maintain order
                [selectedStartPage, selectedEndPage] = [selectedEndPage, selectedStartPage];
            }
        } else if (selectedEndPage === clickedPageNum) {
            // Unselect end page if clicked again
            selectedEndPage = null;
        } else {
            // Reassign end page if both start and end pages are set
            selectedEndPage = clickedPageNum;
            if (selectedStartPage > selectedEndPage) {
                // Swap start and end pages to maintain order
                [selectedStartPage, selectedEndPage] = [selectedEndPage, selectedStartPage];
            }
        }

        updatePageSelection();
        renderSelectedPages();
    }

    function handleStartPageInput() {
        const startPage = parseInt(startPageInput.value);
        if (!isNaN(startPage)) {
            selectedStartPage = startPage;
            if (selectedEndPage !== null && selectedStartPage > selectedEndPage) {
                // Swap start and end pages to maintain order
                [selectedStartPage, selectedEndPage] = [selectedEndPage, selectedStartPage];
            }
        } else {
            selectedStartPage = null;
        }
        updatePageSelection();
        renderSelectedPages();
    }

    function handleEndPageInput() {
        const endPage = parseInt(endPageInput.value);
        if (!isNaN(endPage)) {
            selectedEndPage = endPage;
            if (selectedStartPage !== null && selectedStartPage > selectedEndPage) {
                // Swap start and end pages to maintain order
                [selectedStartPage, selectedEndPage] = [selectedEndPage, selectedStartPage];
            }
        } else {
            selectedEndPage = null;
        }
        updatePageSelection();
        renderSelectedPages();
    }

    function handleRemoveFile() {
        fileInput.value = ""; // Clear the file input
        pdfPreview.classList.add("hidden"); // Hide the PDF preview
        dropContainer.classList.remove("hidden"); // Show the drop container
        pageSlider.innerHTML = ""; // Clear the page slider
        startPageCanvas.getContext("2d").clearRect(0, 0, startPageCanvas.width, startPageCanvas.height); // Clear the start page canvas
        endPageCanvas.getContext("2d").clearRect(0, 0, endPageCanvas.width, endPageCanvas.height); // Clear the end page canvas
        startPageCanvas.width = 0; // Reset canvas width
        startPageCanvas.height = 0; // Reset canvas height
        endPageCanvas.width = 0; // Reset canvas width
        endPageCanvas.height = 0; // Reset canvas height
        startPageInput.value = ""; // Clear the start page input
        endPageInput.value = ""; // Clear the end page input
        selectedStartPage = null; // Reset the selected start page
        selectedEndPage = null; // Reset the selected end page
        updatePageSelection(); // Update page selection styles
        renderSelectedPages(); // Render selected pages on canvases
        hidePageInputs(); // Hide the page inputs

        // Hide the buttons
        document.getElementById("remove-file-button").style.display = "none";
        document.getElementById("slice-pdf-button").style.display = "none";
    }

    function handleExtractStartPage() {
        if (selectedStartPage !== null) {
            extractPage(selectedStartPage);
        }
    }

    function showPageInputs() {
        document.querySelectorAll(".page-input").forEach(el => {
            el.style.display = "flex";
        });
    }

    function hidePageInputs() {
        document.querySelectorAll(".page-input").forEach(el => {
            el.style.display = "none";
        });
    }

    function handleExtractEndPage() {
        if (selectedEndPage !== null) {
            extractPage(selectedEndPage);
        }
    }

    function updatePageSelection() {
        const canvases = pageSlider.getElementsByTagName("canvas");
        for (let canvas of canvases) {
            const pageNum = parseInt(canvas.dataset.pageNum);
            if (pageNum === selectedStartPage) {
                canvas.style.border = "2px solid blue";
            } else if (pageNum === selectedEndPage) {
                canvas.style.border = "2px solid green";
            } else {
                canvas.style.border = "1px solid #999";
            }
        }

        // Update visibility of extraction buttons based on selected pages
        if (selectedStartPage !== null) {
            extractStartPageButton.classList.remove("hidden");
        } else {
            extractStartPageButton.classList.add("hidden");
        }

        if (selectedEndPage !== null) {
            extractEndPageButton.classList.remove("hidden");
        } else {
            extractEndPageButton.classList.add("hidden");
        }

        // Update startPageInput and endPageInput values
        startPageInput.value = selectedStartPage !== null ? selectedStartPage : "";
        endPageInput.value = selectedEndPage !== null ? selectedEndPage : "";
    }

    function renderSelectedPages() {
        if (selectedStartPage !== null) {
            renderPage(pdfDoc, selectedStartPage, startPageCanvas);
        } else {
            clearCanvas(startPageCanvas);
        }
        if (selectedEndPage !== null) {
            renderPage(pdfDoc, selectedEndPage, endPageCanvas);
        } else {
            clearCanvas(endPageCanvas);
        }
    }

    function renderPage(pdf, pageNum, canvas) {
        pdf.getPage(pageNum).then(page => {
            const context = canvas.getContext("2d");
            const viewport = page.getViewport({ scale: 1 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            return page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
        }).then(() => {
            if (canvas.height >= 100) {
                canvas.classList.add('canvas-with-border');
            } else {
                canvas.classList.remove('canvas-with-border');
            }
        }).catch(error => {
            console.error('Error rendering page:', error);
        });
    }

    function clearCanvas(canvas) {
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        canvas.classList.remove('canvas-with-border');
    }

    function extractPage(pageNum) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('page_num', pageNum);

        fetch('/extract', {
            method: 'POST',
            body: formData
        })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `extracted_page_${pageNum}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error('Error:', error));
    }
});