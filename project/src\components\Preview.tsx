import React from 'react';
import { Download } from 'lucide-react';
import { useEbookStore } from '../store/useEbookStore';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf' },
    { 
      src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf',
      fontWeight: 'bold'
    }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  coverImage: {
    maxWidth: '80%',
    maxHeight: '60%',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  author: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: 'grey',
  },
  tocTitle: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  tocItem: {
    fontSize: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tocText: {
    flex: 1,
  },
  tocDots: {
    borderBottom: '1 dotted grey',
    flex: 1,
    marginHorizontal: 4,
  },
  tocPage: {
    width: 30,
    textAlign: 'right',
  },
  chapterPage: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  chapterTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '40%',
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  image: {
    maxWidth: '100%',
    marginVertical: 10,
  },
  caption: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
});

const EbookDocument = () => {
  const { settings, chapters } = useEbookStore();

  const renderTableOfContents = () => (
    <Page size={settings.paperSize} style={styles.page}>
      <Text style={styles.tocTitle}>{settings.tableOfContents.title}</Text>
      {chapters.map((chapter) => (
        <View key={chapter.id} style={styles.tocItem}>
          <Text style={styles.tocText}>{chapter.title}</Text>
          <View style={styles.tocDots} />
          <Text style={styles.tocPage}>{chapter.pageNumber}</Text>
        </View>
      ))}
      {settings.pageNumbering.enabled && (
        <Text
          style={[
            styles.pageNumber,
            { 
              textAlign: settings.pageNumbering.alignment,
              [settings.pageNumbering.position]: 30 
            }
          ]}
          render={({ pageNumber }) => (
            `${pageNumber}`
          )}
        />
      )}
    </Page>
  );

  const renderCoverPage = () => (
    <Page size={settings.paperSize} style={styles.page}>
      <View style={styles.coverPage}>
        {settings.coverImage && (
          <Image src={settings.coverImage} style={styles.coverImage} />
        )}
        <Text style={styles.title}>{settings.title}</Text>
        <Text style={styles.author}>{settings.author}</Text>
      </View>
    </Page>
  );

  const renderChapterPage = (chapter: Chapter) => (
    <React.Fragment key={chapter.id}>
      <Page size={settings.paperSize} style={styles.page}>
        <View style={styles.chapterPage}>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
        </View>
        {settings.pageNumbering.enabled && (
          <Text
            style={[
              styles.pageNumber,
              { 
                textAlign: settings.pageNumbering.alignment,
                [settings.pageNumbering.position]: 30 
              }
            ]}
            render={({ pageNumber }) => (
              `${pageNumber}`
            )}
          />
        )}
      </Page>
      <Page size={settings.paperSize} style={styles.page}>
        <Text style={styles.content}>{chapter.content}</Text>
        {chapter.images.map((image) => (
          <View key={image.id}>
            <View style={{ alignItems: image.alignment }}>
              <Image src={image.url} style={[styles.image, { width: `${image.width}%` }]} />
            </View>
            <Text style={styles.caption}>{image.caption}</Text>
          </View>
        ))}
        {chapter.subChapters.map((subChapter) => (
          <View key={subChapter.id}>
            <Text style={[styles.chapterTitle, { fontSize: 16, marginTop: 20 }]}>
              {subChapter.title}
            </Text>
            <Text style={styles.content}>{subChapter.content}</Text>
          </View>
        ))}
        {settings.pageNumbering.enabled && (
          <Text
            style={[
              styles.pageNumber,
              { 
                textAlign: settings.pageNumbering.alignment,
                [settings.pageNumbering.position]: 30 
              }
            ]}
            render={({ pageNumber }) => (
              `${pageNumber}`
            )}
          />
        )}
      </Page>
    </React.Fragment>
  );

  return (
    <Document>
      {renderCoverPage()}
      {settings.tableOfContents.enabled && renderTableOfContents()}
      {chapters.map(renderChapterPage)}
    </Document>
  );
};

export function Preview() {
  const { settings } = useEbookStore();
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const generatePdf = async () => {
    try {
      setIsGenerating(true);
      const blob = await pdf(<EbookDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // Update iframe source
      if (iframeRef.current) {
        iframeRef.current.src = url;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
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
      <div className="flex justify-end mb-4">
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

      <div className="flex-1">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="PDF Preview"
        />
      </div>
    </div>
  );
}