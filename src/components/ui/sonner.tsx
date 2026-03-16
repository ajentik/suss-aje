"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { DooIcon } from "@/lib/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <DooIcon name="badge-check" size={16} />
        ),
        info: (
          <DooIcon name="info" size={16} />
        ),
        warning: (
          <DooIcon name="alert-triangle" size={16} />
        ),
        error: (
          <DooIcon name="cross" size={16} />
        ),
        loading: (
          <DooIcon name="loader" size={16} className="animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
