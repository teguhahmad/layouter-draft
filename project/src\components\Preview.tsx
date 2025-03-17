import React from 'react';
import { Download } from 'lucide-react';
import { useEbookStore } from '../store/useEbookStore';
import { jsPDF } from 'jspdf';

export function Preview() {
  const { settings, chapters } = useEbookStore();
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const generatePdf = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Create new PDF document
      const doc = new jsPDF({
        unit: 'mm',
        format: settings.paperSize,
      });

      // Set default font
      doc.setFont('helvetica');

      // Helper function to add page number
      const addPageNumber = (pageNum: number) => {
        if (settings.pageNumbering.enabled) {
          doc.setFontSize(10);
          doc.setTextColor(100);
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          
          let x = pageWidth / 2;
          if (settings.pageNumbering.alignment === 'left') x = 20;
          if (settings.pageNumbering.alignment === 'right') x = pageWidth - 20;
          
          let y = pageHeight - 10;
          if (settings.pageNumbering.position === 'top') y = 10;
          
          doc.text(String(pageNum), x, y, { 
            align: settings.pageNumbering.alignment 
          });
        }
      };

      // Cover Page
      doc.setFontSize(24);
      doc.setTextColor(0);
      const titleX = doc.internal.pageSize.width / 2;
      const titleY = doc.internal.pageSize.height / 2;

      if (settings.coverImage) {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = settings.coverImage;
        });
        
        const aspectRatio = img.width / img.height;
        const maxWidth = 150;
        const maxHeight = 150;
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
        
        doc.addImage(
          settings.coverImage,
          'JPEG',
          (doc.internal.pageSize.width - width) / 2,
          titleY - 100,
          width,
          height
        );
      }

      doc.text(settings.title || 'Untitled', titleX, titleY, { align: 'center' });
      doc.setFontSize(16);
      doc.text(settings.author || 'Anonymous', titleX, titleY + 20, { align: 'center' });

      // Table of Contents
      if (settings.tableOfContents.enabled) {
        doc.addPage();
        doc.setFontSize(20);
        doc.text(settings.tableOfContents.title, titleX, 30, { align: 'center' });
        
        let tocY = 50;
        chapters.forEach((chapter, index) => {
          doc.setFontSize(12);
          doc.text(chapter.title, 20, tocY);
          doc.text(String(index + 2), doc.internal.pageSize.width - 20, tocY, { align: 'right' });
          
          // Add dotted line
          const titleWidth = doc.getTextWidth(chapter.title);
          const pageNumWidth = doc.getTextWidth(String(index + 2));
          const dotsWidth = doc.internal.pageSize.width - 40 - titleWidth - pageNumWidth;
          const dots = '.'.repeat(Math.floor(dotsWidth / doc.getTextWidth('.')));
          doc.text(dots, 20 + titleWidth + 5, tocY);
          
          tocY += 10;
        });
        
        addPageNumber(1);
      }

      // Chapters
      chapters.forEach((chapter, chapterIndex) => {
        doc.addPage();
        
        // Chapter title
        doc.setFontSize(18);
        doc.setTextColor(0);
        doc.text(chapter.title, titleX, 30, { align: 'center' });
        
        // Chapter content
        doc.setFontSize(12);
        const contentLines = doc.splitTextToSize(
          chapter.content,
          doc.internal.pageSize.width - 40
        );
        
        let y = 50;
        contentLines.forEach((line: string) => {
          if (y > doc.internal.pageSize.height - 20) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 7;
        });

        // Images
        for (const image of chapter.images) {
          try {
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = image.url;
            });

            if (y > doc.internal.pageSize.height - 60) {
              doc.addPage();
              y = 20;
            }

            const aspectRatio = img.width / img.height;
            const maxWidth = (doc.internal.pageSize.width - 40) * (image.width / 100);
            const width = maxWidth;
            const height = width / aspectRatio;

            let x = 20;
            if (image.alignment === 'center') {
              x = (doc.internal.pageSize.width - width) / 2;
            } else if (image.alignment === 'right') {
              x = doc.internal.pageSize.width - width - 20;
            }

            doc.addImage(image.url, 'JPEG', x, y, width, height);
            y += height + 10;

            if (image.caption) {
              doc.setFontSize(10);
              doc.setTextColor(100);
              doc.text(image.caption, doc.internal.pageSize.width / 2, y, { align: 'center' });
              y += 15;
            }
          } catch (err) {
            console.error('Error adding image:', err);
          }
        }

        // Add page number
        addPageNumber(chapterIndex + 2);
      });

      // Save PDF
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const fileName = settings.title ? `${settings.title}.pdf` : 'ebook.pdf';

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
        </div>
        {!isGenerating && pdfUrl ? (
          <a
            href={pdfUrl}
            download={fileName}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </a>
        ) : (
          <button
            onClick={generatePdf}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
          </button>
        )}
      </div>

      <div className="flex-1 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
        <p className="text-gray-500">
          {isGenerating ? 'Generating PDF...' : 'Click "Generate PDF" to create your document'}
        </p>
      </div>
    </div>
  );
}