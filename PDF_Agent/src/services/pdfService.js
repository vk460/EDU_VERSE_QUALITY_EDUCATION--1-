import * as pdfjsLib from 'pdfjs-dist';

// Use UNPKG CDN to load the worker that matches the installed version perfectly
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = async function() {
      const typedarray = new Uint8Array(this.result);
      
      try {
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let maxPages = pdf.numPages;
        let extractedText = '';

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          extractedText += `[PAGE:${i}] ` + pageText + ' \n';
        }
        resolve(extractedText);
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = function(error) {
      reject(error);
    };

    fileReader.readAsArrayBuffer(file);
  });
};
