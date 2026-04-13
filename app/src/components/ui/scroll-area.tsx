import * as React from "react"
import { cn } from "@/lib/utils"

function ScrollArea({
                      className,
                      children,
                      ...props
                    }: React.HTMLAttributes<HTMLDivElement>) {
  return (
      <div
          data-slot="scroll-area"
          className={cn("relative overflow-y-auto", className)}
          {...props}
      >
        {children}
      </div>
  )
}

function ScrollBar({ className, orientation = "vertical", ...props }: React.HTMLAttributes<HTMLDivElement> & { orientation?: "vertical" | "horizontal" }) {
  // No-op — native scrollbar is used instead
  return null
}

export { ScrollArea, ScrollBar }