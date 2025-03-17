import React from 'react';
import { useEbookStore } from '../store/useEbookStore';
import html2pdf from 'html2pdf.js';

export function Preview() {
  const { settings, chapters } = useEbookStore();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const generatePdf = async () => {
    if (!contentRef.current) return;

    try {
      setIsGenerating(true);

      const opt = {
        margin: [
          settings.margins.top,
          settings.margins.right,
          settings.margins.bottom,
          settings.margins.left,
        ],
        filename: settings.title || 'ebook.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: settings.paperSize, orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(contentRef.current).save();
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

      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-auto">
        <div ref={contentRef} className="p-8">
          {/* Cover Page */}
          {settings.coverImage && (
            <div className="mb-8 text-center">
              <img
                src={settings.coverImage}
                alt="Cover"
                className="max-w-full h-auto mx-auto mb-4"
              />
            </div>
          )}

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