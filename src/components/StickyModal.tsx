"use client";

import type { CSSProperties, ReactNode } from "react";
import { Modal } from "antd";

export function StickyModal({
  open,
  title,
  color = "var(--sticky-mint)",
  okColor = "var(--sticky-yellow)",
  okText = "Save",
  okDisabled = false,
  okLoading = false,
  showFooter = true,
  tilt = -0.8,
  dismissible = true,
  onCancel,
  onOk,
  children,
}: {
  open: boolean;
  title: ReactNode;
  color?: string;
  okColor?: string;
  okText?: string;
  okDisabled?: boolean;
  okLoading?: boolean;
  showFooter?: boolean;
  tilt?: number;
  dismissible?: boolean;
  onCancel: () => void;
  onOk?: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      open={open}
      centered
      destroyOnHidden
      closable={dismissible}
      keyboard={dismissible}
      mask={{ closable: dismissible }}
      title={<span className="font-hand text-3xl font-bold">{title}</span>}
      okText={okText}
      classNames={{ container: "sticky-note" }}
      styles={{ container: { "--sticky": color, rotate: `${tilt}deg` } as CSSProperties }}
      okButtonProps={{
        className: "sticky px-6!",
        style: { "--sticky": okColor } as CSSProperties,
        disabled: okDisabled,
        loading: okLoading,
      }}
      cancelButtonProps={{ type: "text", className: dismissible ? undefined : "hidden!" }}
      footer={showFooter ? undefined : null}
      onCancel={onCancel}
      onOk={onOk}
    >
      {children}
    </Modal>
  );
}
