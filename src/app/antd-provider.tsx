"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider, theme } from "antd";
import type { ReactNode } from "react";
import { palette } from "@/lib/palette";

export function AntdProvider({ children }: { children: ReactNode }) {
  const colors = palette.light;

  return (
    <AntdRegistry layer>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            fontFamily: "var(--font-body), system-ui, sans-serif",
            fontSize: 15,
            borderRadius: 10,
            borderRadiusLG: 14,
            controlHeight: 40,
            controlHeightLG: 48,
            colorPrimary: colors.accent,
            colorPrimaryHover: colors.accentHover,
            colorPrimaryActive: colors.accentActive,
            colorLink: colors.accent,
            colorError: colors.danger,
            colorErrorHover: colors.dangerHover,
            colorErrorActive: colors.dangerActive,
            colorText: colors.ink,
            colorTextSecondary: colors.muted,
            colorTextTertiary: colors.muted,
            colorTextPlaceholder: colors.muted,
            colorBorder: colors.line,
            colorBorderSecondary: colors.line,
            colorSplit: colors.line,
            colorBgContainer: colors.paper,
            colorBgElevated: colors.paper,
            colorBgLayout: colors.background,
          },
          components: {
            Button: {
              fontWeight: 600,
              primaryColor: colors.onAccent,
              defaultHoverColor: colors.accentText,
              defaultHoverBorderColor: colors.accentText,
              defaultHoverBg: colors.accentTint,
              defaultActiveColor: colors.onAccent,
              defaultActiveBorderColor: colors.onAccent,
              defaultActiveBg: colors.accentTint,
              primaryShadow: "none",
              dangerShadow: "none",
              defaultShadow: "none",
            },
            Card: { bodyPadding: 18 },
          },
        }}
      >
        <App component={false}>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
