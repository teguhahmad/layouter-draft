import { create } from 'zustand';
import type { Chapter, EbookSettings } from '../types';

interface EbookStore {
  chapters: Chapter[];
  settings: EbookSettings;
  addChapter: (chapter: Partial<Chapter>) => void;
  updateChapter: (id: string, chapter: Partial<Chapter>) => void;
  removeChapter: (id: string) => void;
  reorderChapters: (chapters: Chapter[]) => void;
  updateSettings: (settings: Partial<EbookSettings>) => void;
  calculatePageNumbers: () => void;
  addSubChapter: (chapterId: string, title: string) => void;
  removeSubChapter: (chapterId: string, subChapterId: string) => void;
}

const defaultSettings: EbookSettings = {
  title: '',
  author: '',
  description: '',
  coverImage: null,
  backCoverImage: null,
  paperSize: 'A4',
  margins: {
    top: 2.54,
    bottom: 2.54,
    left: 2.54,
    right: 2.54,
  },
  fonts: {
    title: {
      family: 'Helvetica',
      size: 24,
      alignment: 'center',
      lineHeight: 1.5,
    },
    subtitle: {
      family: 'Helvetica',
      size: 18,
      alignment: 'left',
      lineHeight: 1.5,
    },
    paragraph: {
      family: 'Helvetica',
      size: 12,
      alignment: 'justify',
      lineHeight: 1.5,
    },
    header: {
      family: 'Helvetica',
      size: 10,
      alignment: 'center',
      lineHeight: 1.2,
    },
    footer: {
      family: 'Helvetica',
      size: 10,
      alignment: 'center',
      lineHeight: 1.2,
    },
  },
  pageNumbering: {
    enabled: true,
    startFrom: 1,
    position: 'bottom',
    alignment: 'center',
    style: 'decimal',
  },
  tableOfContents: {
    enabled: true,
    title: 'Table of Contents',
    includeSubChapters: true,
  },
  header: {
    enabled: false,
    text: '',
    alternateEvenOdd: false,
  },
  footer: {
    enabled: false,
    text: '',
    alternateEvenOdd: false,
  },
};

export const useEbookStore = create<EbookStore>((set, get) => ({
  chapters: [],
  settings: defaultSettings,
  addChapter: (chapter) =>
    set((state) => ({
      chapters: [
        ...state.chapters,
        {
          id: crypto.randomUUID(),
          title: chapter.title || 'New Chapter',
          content: chapter.content || '',
          images: chapter.images || [],
          type: chapter.type || 'chapter',
          indentation: chapter.indentation || 0,
          lineSpacing: chapter.lineSpacing || 1.5,
          subChapters: chapter.subChapters || [],
        },
      ],
    })),
  updateChapter: (id, chapter) =>
    set((state) => ({
      chapters: state.chapters.map((ch) =>
        ch.id === id ? { ...ch, ...chapter } : ch
      ),
    })),
  removeChapter: (id) =>
    set((state) => ({
      chapters: state.chapters.filter((ch) => ch.id !== id),
    })),
  reorderChapters: (chapters) => {
    set({ chapters });
    get().calculatePageNumbers();
  },
  updateSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),
  calculatePageNumbers: () => {
    const { chapters } = get();
    let currentPage = 1;

    const updatedChapters = chapters.map((chapter) => {
      if (chapter.type === 'frontmatter') {
        const pageNumber = currentPage;
        currentPage += 1;
        return { ...chapter, pageNumber };
      } else if (chapter.type === 'chapter') {
        const pageNumber = currentPage;
        // Estimate pages based on content length, images, and subchapters
        const contentPages = Math.ceil(chapter.content.length / 3000);
        const imagePages = chapter.images.length;
        const subChapterPages = chapter.subChapters.reduce((acc, sub) => 
          acc + Math.ceil(sub.content.length / 3000), 0);
        currentPage += contentPages + imagePages + subChapterPages;
        
        // Update subchapter page numbers
        const subChapters = chapter.subChapters.map((sub, index) => ({
          ...sub,
          pageNumber: pageNumber + index + 1,
        }));
        
        return { ...chapter, pageNumber, subChapters };
      }
      return chapter;
    });

    set({ chapters: updatedChapters });
  },
  addSubChapter: (chapterId, title) => {
    set((state) => ({
      chapters: state.chapters.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              subChapters: [
                ...ch.subChapters,
                {
                  id: crypto.randomUUID(),
                  title,
                  content: '',
                },
              ],
            }
          : ch
      ),
    }));
    get().calculatePageNumbers();
  },
  removeSubChapter: (chapterId, subChapterId) => {
    set((state) => ({
      chapters: state.chapters.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              subChapters: ch.subChapters.filter((sub) => sub.id !== subChapterId),
            }
          : ch
      ),
    }));
    get().calculatePageNumbers();
  },
}));