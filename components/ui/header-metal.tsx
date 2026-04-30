import { cn } from "@/lib/utils/cn";

interface HeaderMetalProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function HeaderMetal({ children, className, ...props }: HeaderMetalProps) {
  return (
    <header
      className={cn("header-brushed flex items-center px-6", className)}
      {...props}
    >
      {children}
    </header>
  );
}
