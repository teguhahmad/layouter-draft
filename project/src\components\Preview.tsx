import React from 'react';
import { useEbookStore } from '../store/useEbookStore';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

export function Preview() {
  const { settings, chapters } = useEbookStore();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const generateCoverPDF = async (imageUrl: string): Promise<Uint8Array> => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: settings.paperSize,
      compress: true
    });

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = imageUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 2480;
        canvas.height = 3508;
        
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
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
          
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
          
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
          
          resolve(doc.output('arraybuffer'));
        }
      };
    });
  };

  const generatePdf = async () => {
    if (!contentRef.current) return;

    try {
      setIsGenerating(true);

      let coverPdfBytes: Uint8Array | null = null;
      if (settings.coverImage) {
        coverPdfBytes = new Uint8Array(await generateCoverPDF(settings.coverImage));
      }

      let backCoverPdfBytes: Uint8Array | null = null;
      if (settings.backCoverImage) {
        backCoverPdfBytes = new Uint8Array(await generateCoverPDF(settings.backCoverImage));
      }

      const doc = new jsPDF({
        unit: 'mm',
        format: settings.paperSize,
        orientation: 'portrait'
      });

      // Set font
      doc.setFont(settings.fonts.paragraph.family);
      doc.setFontSize(settings.fonts.paragraph.size);

      // Calculate page dimensions in mm
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = settings.margins.left * 10;
      const marginRight = settings.margins.right * 10;
      const marginTop = settings.margins.top * 10;
      const marginBottom = settings.margins.bottom * 10;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Add title page
      doc.setFont(settings.fonts.title.family);
      doc.setFontSize(settings.fonts.title.size);
      doc.text(settings.title, pageWidth / 2, marginTop + 40, { align: settings.fonts.title.alignment });
      
      doc.setFont(settings.fonts.subtitle.family);
      doc.setFontSize(settings.fonts.subtitle.size);
      doc.text(settings.author, pageWidth / 2, marginTop + 60, { align: settings.fonts.subtitle.alignment });

      doc.addPage();

      // Add table of contents if enabled
      if (settings.tableOfContents.enabled) {
        doc.setFont(settings.fonts.subtitle.family);
        doc.setFontSize(settings.fonts.subtitle.size);
        doc.text(settings.tableOfContents.title, marginLeft, marginTop + 20);

        doc.setFont(settings.fonts.paragraph.family);
        doc.setFontSize(settings.fonts.paragraph.size);
        let tocY = marginTop + 40;

        chapters.forEach((chapter, index) => {
          const prefix = chapter.type === 'chapter' ? `${index + 1}. ` : '';
          doc.text(`${prefix}${chapter.title}`, marginLeft, tocY);
          doc.text(String(chapter.pageNumber || ''), pageWidth - marginRight, tocY, { align: 'right' });
          tocY += 10;
        });

        doc.addPage();
      }

      // Add chapters
      chapters.forEach((chapter, index) => {
        // Chapter title
        doc.setFont(settings.fonts.subtitle.family);
        doc.setFontSize(settings.fonts.subtitle.size);
        let y = marginTop + 20;
        doc.text(chapter.title, marginLeft, y, { align: settings.fonts.subtitle.alignment });

        // Chapter content
        doc.setFont(settings.fonts.paragraph.family);
        doc.setFontSize(settings.fonts.paragraph.size);
        y += 20;

        const lines = doc.splitTextToSize(chapter.content, contentWidth);
        lines.forEach((line: string) => {
          if (y > pageHeight - marginBottom) {
            doc.addPage();
            y = marginTop;
          }
          doc.text(line, marginLeft + (chapter.indentation * 10), y, {
            align: settings.fonts.paragraph.alignment
          });
          y += settings.fonts.paragraph.size * chapter.lineSpacing * 0.352778; // Convert pt to mm
        });

        // Add images
        chapter.images.forEach((image) => {
          if (y > pageHeight - marginBottom - 40) {
            doc.addPage();
            y = marginTop;
          }

          const img = new Image();
          img.src = image.url;
          const imgWidth = (contentWidth * image.width) / 100;
          const imgHeight = (imgWidth * img.height) / img.width;

          let x = marginLeft;
          if (image.alignment === 'center') {
            x = (pageWidth - imgWidth) / 2;
          } else if (image.alignment === 'right') {
            x = pageWidth - marginRight - imgWidth;
          }

          doc.addImage(image.url, 'JPEG', x, y, imgWidth, imgHeight);
          y += imgHeight + 10;

          if (image.caption) {
            doc.setFontSize(settings.fonts.paragraph.size * 0.8);
            doc.text(image.caption, pageWidth / 2, y, { align: 'center' });
            y += 15;
          }
        });

        // Add subchapters
        chapter.subChapters.forEach((subChapter) => {
          if (y > pageHeight - marginBottom - 20) {
            doc.addPage();
            y = marginTop;
          }

          doc.setFont(settings.fonts.subtitle.family);
          doc.setFontSize(settings.fonts.subtitle.size * 0.8);
          y += 20;
          doc.text(subChapter.title, marginLeft, y);

          doc.setFont(settings.fonts.paragraph.family);
          doc.setFontSize(settings.fonts.paragraph.size);
          y += 15;

          const subLines = doc.splitTextToSize(subChapter.content, contentWidth);
          subLines.forEach((line: string) => {
            if (y > pageHeight - marginBottom) {
              doc.addPage();
              y = marginTop;
            }
            doc.text(line, marginLeft + (chapter.indentation * 10), y, {
              align: settings.fonts.paragraph.alignment
            });
            y += settings.fonts.paragraph.size * chapter.lineSpacing * 0.352778;
          });
        });

        if (index < chapters.length - 1) {
          doc.addPage();
        }
      });

      const contentPdfBytes = new Uint8Array(doc.output('arraybuffer'));

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
        <div ref={contentRef} className="p-8 max-w-[800px] mx-auto">
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
                    <span className="mr-2">{chapter.type === 'chapter' ? `${index + 1}.` : ''}</span>
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
                textAlign: settings.fonts.paragraph.alignment as any,
                lineHeight: chapter.lineSpacing,
                textIndent: `${chapter.indentation}em`,
                whiteSpace: 'pre-wrap',
                userSelect: 'text',
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
                    textAlign: settings.fonts.paragraph.alignment as any,
                    lineHeight: chapter.lineSpacing,
                    textIndent: `${chapter.indentation}em`,
                    whiteSpace: 'pre-wrap',
                    userSelect: 'text',
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