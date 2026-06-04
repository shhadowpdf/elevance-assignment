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

interface OtpPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  loading?: boolean;
  error?: string;
  method: "mobile" | "email";
  target: string;
  mandatory?: boolean;
}

const OtpPromptDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onResend,
  loading = false,
  error,
  method,
  target,
  mandatory = false,
}: OtpPromptDialogProps) => {
  const [otp, setOtp] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (open) {
      setOtp("");
      setValidationError("");
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = otp.trim();
    if (!trimmed) {
      setValidationError("Please enter the OTP.");
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
        showCloseButton={!mandatory}
        onEscapeKeyDown={preventDismiss}
        onPointerDownOutside={preventDismiss}
      >
        <DialogHeader>
          <DialogTitle>Enter your OTP</DialogTitle>
          <DialogDescription>
            We sent a one-time passcode to your {method} at {target}.
            Please enter it below to continue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">OTP</label>
            <Input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              maxLength={6}
            />
          </div>
          {(validationError || error) && (
            <p className="text-sm text-red-500">{validationError || error}</p>
          )}
          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="secondary" onClick={onResend} disabled={loading}>
              Resend OTP
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OtpPromptDialog;
