import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "var(--color-card)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
