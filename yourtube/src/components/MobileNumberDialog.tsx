import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface MobileNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (mobile: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  mandatory?: boolean;
}

const MobileNumberDialog = ({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  error,
  mandatory = false,
}: MobileNumberDialogProps) => {
  const [mobile, setMobile] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (open) {
      setMobile("");
      setValidationError("");
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = mobile.trim();
    if (!trimmed) {
      setValidationError("Please enter your mobile number.");
      return;
    }
    if (!/^[0-9]{7,15}$/.test(trimmed)) {
      setValidationError("Please enter a valid mobile number.");
      return;
    }
    setValidationError("");
    await onSubmit(trimmed);
  };

  const preventDismiss = (event: any) => {
    if (mandatory) {
      event.preventDefault();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={preventDismiss}
        onPointerDownOutside={preventDismiss}
      >
        <DialogHeader>
          <DialogTitle>Enter your mobile number</DialogTitle>
          <DialogDescription>
            We need your phone number to complete your profile. This is a one-time step.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Mobile number</label>
            <Input
              type="tel"
              placeholder="1234567890"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              inputMode="numeric"
              maxLength={15}
            />
          </div>
          {(validationError || error) && (
            <p className="text-sm text-red-500">{validationError || error}</p>
          )}
          <DialogFooter className="justify-end gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MobileNumberDialog;
