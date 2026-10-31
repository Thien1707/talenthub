"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
  CV_SECTION_LABELS,
  reorderSections,
  type CvSectionKey,
} from "@/lib/cv/section-order";

function SortableRow({
  id,
  label,
  hint,
}: {
  id: CvSectionKey;
  label: string;
  hint?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border bg-white px-2 py-2 ${
        isDragging ? "z-10 border-blue-400 shadow-md" : "border-slate-200"
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        aria-label={`Kéo ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

export function CvSectionOrderList({
  order,
  onOrderChange,
  layoutHint,
}: {
  order: CvSectionKey[];
  onOrderChange: (next: CvSectionKey[]) => void;
  layoutHint?: "modern" | "topcv" | "classic";
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onOrderChange(
      reorderSections(
        order,
        active.id as CvSectionKey,
        over.id as CvSectionKey,
      ),
    );
  };

  const skillsHint =
    layoutHint === "modern"
      ? "Mẫu 2 cột: kỹ năng vẫn hiển thị trên sidebar."
      : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {order.map((key) => (
            <SortableRow
              key={key}
              id={key}
              label={CV_SECTION_LABELS[key]}
              hint={key === "skills" ? skillsHint : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
