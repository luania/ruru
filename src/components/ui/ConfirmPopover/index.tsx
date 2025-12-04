import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";
import { Button } from "../Button";

interface ConfirmPopoverProps {
  title?: string;
  description?: string;
  onConfirm: () => void;
  trigger: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export const ConfirmPopover = ({
  title = "Confirm",
  description = "Are you sure?",
  onConfirm,
  trigger,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
}: ConfirmPopoverProps) => {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-60 p-3">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none text-white">{title}</h4>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-400 hover:text-white"
              onClick={() => setOpen(false)}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              size="sm"
              className="h-7 text-xs"
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
