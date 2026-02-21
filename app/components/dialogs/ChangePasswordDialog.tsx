import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface ChangePasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type FetcherData =
    | { error: string; success?: never }
    | { success: true; error?: never };

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const fetcher = useFetcher<FetcherData>();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);

    const isSubmitting = fetcher.state === "submitting";

    // 成功後關閉對話框並重置
    useEffect(() => {
        if (fetcher.data && "success" in fetcher.data && fetcher.data.success && !isSubmitting) {
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setValidationError(null);
            onOpenChange(false);
            // 可選：顯示成功提示，但這裡我們先簡單處理
        }
    }, [fetcher.data, isSubmitting, onOpenChange]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (!oldPassword) {
            setValidationError("請輸入目前的密碼");
            return;
        }
        if (newPassword.length < 6) {
            setValidationError("新密碼長度至少需 6 個字元");
            return;
        }
        if (newPassword !== confirmPassword) {
            setValidationError("新密碼與確認密碼不符");
            return;
        }

        fetcher.submit(
            {
                intent: "change-password",
                oldPassword,
                newPassword,
            },
            {
                method: "post",
                action: "/dashboard", // 我們在 dashboard 的 action 處理
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>修改密碼</DialogTitle>
                    <DialogDescription>
                        請輸入目前的密碼與希更新的新密碼
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 p-4 mb-4 bg-card/80 rounded-lg">
                        <div className="space-y-2">
                            <Label htmlFor="old-password">目前的密碼</Label>
                            <Input
                                id="old-password"
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">新密碼</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">確認新密碼</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {(validationError || (fetcher.data && "error" in fetcher.data && fetcher.data.error)) && (
                            <div className="text-sm text-destructive font-medium">
                                {validationError || (fetcher.data as any).error}
                            </div>
                        )}

                        {fetcher.data && "success" in fetcher.data && fetcher.data.success && (
                            <div className="text-sm text-green-600 font-medium">
                                密碼修改成功！
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    處理中...
                                </>
                            ) : (
                                "確認修改"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
