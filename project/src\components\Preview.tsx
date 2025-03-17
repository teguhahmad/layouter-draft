import React from 'react';
import { useEbookStore } from '../store/useEbookStore';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import html2pdf from 'html2pdf.js';

export function Preview() {
  const { settings, chapters } = useEbookStore();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const generateCoverPDF = async (imageUrl: string): Promise<Uint8Array> => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = imageUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to A4 dimensions at 300 DPI
        canvas.width = 2480;
        canvas.height = 3508;
        
        if (ctx) {
          // Fill white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Calculate dimensions to maintain aspect ratio
          const imgRatio = img.width / img.height;
          const pageRatio = canvas.width / canvas.height;
          
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          
          if (imgRatio > pageRatio) {
            drawHeight = canvas.width / imgRatio;
          } else {
            drawWidth = canvas.height * imgRatio;
          }
          
          const x = (canvas.width - drawWidth) / 2;
          const y = (canvas.height - drawHeight) / 2;
          
          // Draw image
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
          
          // Convert to PDF
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          doc.addImage(imgData, 'JPEG', 0, 0, 210, 297); // A4 dimensions in mm
          
          resolve(doc.output('arraybuffer'));
        }
      };
    });
  };

  const generatePdf = async () => {
    if (!contentRef.current) return;

    try {
      setIsGenerating(true);

      // Generate cover PDF if exists
      let coverPdfBytes: Uint8Array | null = null;
      if (settings.coverImage) {
        coverPdfBytes = new Uint8Array(await generateCoverPDF(settings.coverImage));
      }

      // Generate back cover PDF if exists
      let backCoverPdfBytes: Uint8Array | null = null;
      if (settings.backCoverImage) {
        backCoverPdfBytes = new Uint8Array(await generateCoverPDF(settings.backCoverImage));
      }

      // Generate content PDF
      const contentPdf = await html2pdf().set({
        margin: [
          settings.margins.top,
          settings.margins.right,
          settings.margins.bottom,
          settings.margins.left,
        ],
        filename: 'content.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: settings.paperSize, orientation: 'portrait' }
      }).from(contentRef.current).output('arraybuffer');
      const contentPdfBytes = new Uint8Array(contentPdf);

      // Merge PDFs
      const mergedPdf = await PDFDocument.create();
      
      if (coverPdfBytes) {
        const coverDoc = await PDFDocument.load(coverPdfBytes);
        const coverPages = await mergedPdf.copyPages(coverDoc, coverDoc.getPageIndices());
        coverPages.forEach(page => mergedPdf.addPage(page));
      }

      const contentDoc = await PDFDocument.load(contentPdfBytes);
      const contentPages = await mergedPdf.copyPages(contentDoc, contentDoc.getPageIndices());
      contentPages.forEach(page => mergedPdf.addPage(page));

      if (backCoverPdfBytes) {
        const backCoverDoc = await PDFDocument.load(backCoverPdfBytes);
        const backCoverPages = await mergedPdf.copyPages(backCoverDoc, backCoverDoc.getPageIndices());
        backCoverPages.forEach(page => mergedPdf.addPage(page));
      }

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = settings.title || 'ebook.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <button
        id="generate-pdf-btn"
        onClick={generatePdf}
        disabled={isGenerating}
        className="hidden"
      />

      <div className="flex-1 overflow-auto">
        <div ref={contentRef} className="p-8">
          {/* Title Page */}
          <div className="mb-16 text-center">
            <h1 style={{
              fontSize: `${settings.fonts.title.size}pt`,
              fontFamily: settings.fonts.title.family,
              textAlign: settings.fonts.title.alignment,
              lineHeight: settings.fonts.title.lineHeight,
            }} className="mb-4">
              {settings.title}
            </h1>
            <p style={{
              fontSize: `${settings.fonts.subtitle.size}pt`,
              fontFamily: settings.fonts.subtitle.family,
              textAlign: settings.fonts.subtitle.alignment,
              lineHeight: settings.fonts.subtitle.lineHeight,
            }}>
              {settings.author}
            </p>
          </div>

          {/* Table of Contents */}
          {settings.tableOfContents.enabled && (
            <div className="mb-16">
              <h2 style={{
                fontSize: `${settings.fonts.subtitle.size}pt`,
                fontFamily: settings.fonts.subtitle.family,
                textAlign: 'left',
                marginBottom: '1em',
              }}>
                {settings.tableOfContents.title}
              </h2>
              <div className="space-y-2">
                {chapters.map((chapter, index) => (
                  <div key={chapter.id} className="flex items-center">
                    <span className="mr-2">{index + 1}.</span>
                    <span className="flex-1">{chapter.title}</span>
                    <span className="ml-2">{chapter.pageNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapters */}
          {chapters.map((chapter) => (
            <div key={chapter.id} className="mb-16">
              <h2 style={{
                fontSize: `${settings.fonts.subtitle.size}pt`,
                fontFamily: settings.fonts.subtitle.family,
                textAlign: settings.fonts.subtitle.alignment,
                lineHeight: settings.fonts.subtitle.lineHeight,
                marginBottom: '1em',
              }}>
                {chapter.title}
              </h2>
              <div style={{
                fontSize: `${settings.fonts.paragraph.size}pt`,
                fontFamily: settings.fonts.paragraph.family,
                textAlign: settings.fonts.paragraph.alignment,
                lineHeight: chapter.lineSpacing,
                textIndent: `${chapter.indentation}em`,
              }}>
                {chapter.content}
              </div>

              {/* Chapter Images */}
              {chapter.images.map((image) => (
                <div
                  key={image.id}
                  className="my-8"
                  style={{ textAlign: image.alignment }}
                >
                  <img
                    src={image.url}
                    alt={image.caption}
                    style={{ width: `${image.width}%`, margin: '0 auto' }}
                  />
                  {image.caption && (
                    <p className="mt-2 text-sm text-gray-600 text-center">
                      {image.caption}
                    </p>
                  )}
                </div>
              ))}

              {/* Subchapters */}
              {chapter.subChapters.map((subChapter) => (
                <div key={subChapter.id} className="mt-8">
                  <h3 style={{
                    fontSize: `${settings.fonts.subtitle.size * 0.8}pt`,
                    fontFamily: settings.fonts.subtitle.family,
                    textAlign: settings.fonts.subtitle.alignment,
                    lineHeight: settings.fonts.subtitle.lineHeight,
                    marginBottom: '0.5em',
                  }}>
                    {subChapter.title}
                  </h3>
                  <div style={{
                    fontSize: `${settings.fonts.paragraph.size}pt`,
                    fontFamily: settings.fonts.paragraph.family,
                    textAlign: settings.fonts.paragraph.alignment,
                    lineHeight: chapter.lineSpacing,
                    textIndent: `${chapter.indentation}em`,
                  }}>
                    {subChapter.content}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}