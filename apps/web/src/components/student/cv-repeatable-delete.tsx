"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

export function CvEntryDeleteButton({
  onClick,
  label = "Xóa mục này",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
      onClick={onClick}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}

export function CvDeleteConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="cv-delete-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 id="cv-delete-title" className="text-lg font-semibold text-slate-900">
          Xóa mục này?
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Bạn có chắc chắn muốn xóa nội dung này khỏi CV không? Thao tác này không
          thể hoàn tác sau khi lưu.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
            onClick={onCancel}
          >
            Hủy
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

function isBlankItem(item: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((k) => !String(item[k] ?? "").trim());
}

/** Xóa ngay nếu mục trống; nếu không thì mở dialog xác nhận. */
export function useCvEntryDelete<T extends { id?: string }>(
  items: T[],
  onItems: (next: T[]) => void,
  emptyKeys: string[],
) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const removeById = (id: string) => {
    onItems(items.filter((item) => item.id !== id));
  };

  const requestDelete = (item: T) => {
    const id = item.id;
    if (!id) {
      onItems(items.filter((x) => x !== item));
      return;
    }
    if (isBlankItem(item as Record<string, unknown>, emptyKeys)) {
      removeById(id);
      return;
    }
    setPendingId(id);
  };

  const confirmDelete = () => {
    if (pendingId) removeById(pendingId);
    setPendingId(null);
  };

  const cancelDelete = () => setPendingId(null);

  return {
    requestDelete,
    confirmDelete,
    cancelDelete,
    pendingOpen: pendingId != null,
  };
}
