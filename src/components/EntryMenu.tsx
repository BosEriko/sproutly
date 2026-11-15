"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "antd";
import { Pencil, Trash2 } from "lucide-react";
import { StickyModal } from "./StickyModal";

export function EntryMenu({
  open,
  title,
  canEdit = true,
  onEdit,
  onDelete,
  onClose,
}: {
  open: boolean;
  title: ReactNode;
  canEdit?: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lastOpen, setLastOpen] = useState(open);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setConfirming(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch {
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  }

  const note = (sticky: string) => ({ "--sticky": sticky }) as CSSProperties;

  return (
    <StickyModal open={open} title={title} color="var(--sticky-yellow)" showFooter={false} onCancel={onClose}>
      {confirming ? (
        <div className="flex flex-col gap-4 pt-2">
          <p>Delete this entry? Its Discord card will be removed too.</p>
          <div className="flex justify-end gap-2">
            <Button type="text" onClick={() => setConfirming(false)} disabled={deleting}>
              Keep it
            </Button>
            <Button
              type="primary"
              loading={deleting}
              icon={<Trash2 size={16} aria-hidden />}
              onClick={handleDelete}
              className="sticky px-6!"
              style={note("var(--sticky-pink)")}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className={`grid gap-3 pt-2 ${canEdit ? "grid-cols-2" : "grid-cols-1"}`}>
          {canEdit && (
            <Button
              type="primary"
              size="large"
              icon={<Pencil size={22} aria-hidden />}
              onClick={onEdit}
              className="sticky h-20! flex-col! gap-0.5! font-hand text-2xl!"
              style={{ ...note("var(--sticky-blue)"), rotate: "0.6deg" }}
            >
              Edit
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            icon={<Trash2 size={22} aria-hidden />}
            onClick={() => setConfirming(true)}
            className="sticky h-20! flex-col! gap-0.5! font-hand text-2xl!"
            style={{ ...note("var(--sticky-pink)"), rotate: "-0.6deg" }}
          >
            Delete
          </Button>
        </div>
      )}
    </StickyModal>
  );
}
