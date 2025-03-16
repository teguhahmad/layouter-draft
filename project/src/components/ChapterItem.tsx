import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Image, Plus, Minus } from 'lucide-react';
import { useEbookStore } from '../store/useEbookStore';
import type { Chapter, ChapterImage } from '../types';

interface ChapterItemProps {
  chapter: Chapter;
  index: number;
}

export function ChapterItem({ chapter, index }: ChapterItemProps) {
  const { updateChapter, removeChapter, addSubChapter, removeSubChapter } = useEbookStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ChapterImage = {
          id: crypto.randomUUID(),
          url: e.target?.result as string,
          caption: '',
          alignment: 'center',
          width: 100,
        };
        updateChapter(chapter.id, {
          images: [...chapter.images, newImage],
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageCaptionChange = (imageId: string, caption: string) => {
    updateChapter(chapter.id, {
      images: chapter.images.map((img) =>
        img.id === imageId ? { ...img, caption } : img
      ),
    });
  };

  const handleImageAlignmentChange = (imageId: string, alignment: 'left' | 'center' | 'right') => {
    updateChapter(chapter.id, {
      images: chapter.images.map((img) =>
        img.id === imageId ? { ...img, alignment } : img
      ),
    });
  };

  const handleImageWidthChange = (imageId: string, width: number) => {
    updateChapter(chapter.id, {
      images: chapter.images.map((img) =>
        img.id === imageId ? { ...img, width } : img
      ),
    });
  };

  const handleAddSubChapter = () => {
    addSubChapter(chapter.id, `Section ${chapter.subChapters.length + 1}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 shadow-sm"
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>
          <input
            type="text"
            value={chapter.title}
            onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
            className="flex-1 text-lg font-medium bg-transparent border-none focus:ring-0 p-0"
            placeholder="Chapter Title"
          />
          <button
            onClick={() => removeChapter(chapter.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Indentation (em)</label>
          <input
            type="number"
            value={chapter.indentation}
            onChange={(e) => updateChapter(chapter.id, { indentation: parseFloat(e.target.value) })}
            min="0"
            step="0.5"
            className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Line Spacing</label>
          <input
            type="number"
            value={chapter.lineSpacing}
            onChange={(e) => updateChapter(chapter.id, { lineSpacing: parseFloat(e.target.value) })}
            min="1"
            step="0.1"
            className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <textarea
          value={chapter.content}
          onChange={(e) => updateChapter(chapter.id, { content: e.target.value })}
          rows={4}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Chapter content..."
        />

        <div className="space-y-4">
          {chapter.images.map((image) => (
            <div key={image.id} className="space-y-2 border rounded-lg p-4">
              <img
                src={image.url}
                alt={image.caption}
                className="max-w-full h-auto rounded"
              />
              <div className="grid gap-4">
                <input
                  type="text"
                  value={image.caption}
                  onChange={(e) => handleImageCaptionChange(image.id, e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Image caption..."
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alignment</label>
                    <select
                      value={image.alignment}
                      onChange={(e) => handleImageAlignmentChange(
                        image.id,
                        e.target.value as 'left' | 'center' | 'right'
                      )}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Width (%)</label>
                    <input
                      type="number"
                      value={image.width}
                      onChange={(e) => handleImageWidthChange(image.id, parseInt(e.target.value))}
                      min="10"
                      max="100"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Sections</h4>
            <button
              onClick={handleAddSubChapter}
              className="inline-flex items-center px-2 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Section
            </button>
          </div>
          {chapter.subChapters.map((subChapter) => (
            <div key={subChapter.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subChapter.title}
                  onChange={(e) => updateChapter(chapter.id, {
                    subChapters: chapter.subChapters.map((sub) =>
                      sub.id === subChapter.id
                        ? { ...sub, title: e.target.value }
                        : sub
                    ),
                  })}
                  className="flex-1 text-sm font-medium bg-transparent border-none focus:ring-0 p-0"
                  placeholder="Section Title"
                />
                <button
                  onClick={() => removeSubChapter(chapter.id, subChapter.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={subChapter.content}
                onChange={(e) => updateChapter(chapter.id, {
                  subChapters: chapter.subChapters.map((sub) =>
                    sub.id === subChapter.id
                      ? { ...sub, content: e.target.value }
                      : sub
                  ),
                })}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Section content..."
              />
            </div>
          ))}
        </div>

        <div>
          <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
            <Image className="w-4 h-4 mr-2" />
            Add Image
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
}