import React from 'react';
import { useEbookStore } from '../store/useEbookStore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChapterItem } from './ChapterItem';
import { Plus } from 'lucide-react';

export function ChapterList() {
  const { chapters, addChapter, reorderChapters } = useEbookStore();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddChapter = () => {
    addChapter({
      id: crypto.randomUUID(),
      title: `Chapter ${chapters.length + 1}`,
      content: '',
      images: [],
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = chapters.findIndex((chapter) => chapter.id === active.id);
      const newIndex = chapters.findIndex((chapter) => chapter.id === over.id);
      reorderChapters(arrayMove(chapters, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Chapters</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your ebook chapters and their content.
        </p>
      </div>

      <button
        onClick={handleAddChapter}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Chapter
      </button>

      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={chapters.map((chapter) => chapter.id)}
            strategy={verticalListSortingStrategy}
          >
            {chapters.map((chapter, index) => (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                index={index}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}