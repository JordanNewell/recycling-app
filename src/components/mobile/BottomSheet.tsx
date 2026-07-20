import { ReactNode } from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  description?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
}: BottomSheetProps) {
  // vaul's Drawer handles its own drag + spring animations; wrapping the content
  // in a framer-motion motion.div with its own initial/animate/exit fights with
  // vaul's transform, causing the sheet to pop/disappear instead of slide.
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 outline-none bg-white dark:bg-gray-900 rounded-t-[20px] shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {(title || description) && (
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {title && (
                    <Drawer.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {title}
                    </Drawer.Title>
                  )}
                  {description && (
                    <Drawer.Description className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {description}
                    </Drawer.Description>
                  )}
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="ml-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
