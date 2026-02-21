import { Form } from "@remix-run/react";
import { LogOut, Edit, Share2, UserIcon, ChevronDown, EyeIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface DashboardHeaderProps {
    userEmail: string;
    onShare: () => void;
    onChangePassword: () => void;
    workspaceSwitcher?: React.ReactNode;
}

export function DashboardHeader({
    userEmail,
    onShare,
    onChangePassword,
    workspaceSwitcher,
}: DashboardHeaderProps) {
    return (
        <header className="bg-card/80 backdrop-blur-sm border-border px-6 pt-4 pb-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/90 text-primary-foreground shadow-sm">
                            <img src="/favicon-re.svg" alt="Kit" className="h-full w-full object-contain rounded-xl" />
                        </div>
                        <h1 className="text-xl font-semibold text-primary">
                            Kit
                        </h1>
                    </div>
                    {workspaceSwitcher && (
                        <div className="ml-2">
                            {workspaceSwitcher}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-0">
                    <a href="/me">
                        <Button variant="ghost" className="px-4 py-1 rounded-full bg-transparent shadow-none">
                            <EyeIcon className="w-4 h-4" />
                            <span className="hidden md:block text-xs">預覽</span>
                        </Button>
                    </a>
                    <Button onClick={onShare} variant="ghost" className="px-4 py-1 rounded-full bg-transparent shadow-none">
                        <Share2 className="w-4 h-4" />
                        <span className="hidden md:block text-xs">分享</span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button onClick={onShare} variant="ghost" className="px-4 py-1 rounded-full bg-transparent shadow-none">
                                <UserIcon className="w-4 h-4" />
                                <ChevronDown className="w-4 h-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <div className="grid grid-cols-1 gap-2 px-3 pt-1.5 pb-2 -mx-1 mb-1 border-b border-border">
                                <p className="text-sm text-muted-foreground">{userEmail}</p>
                            </div>
                            <DropdownMenuItem
                                onClick={onChangePassword}
                                className="w-full flex items-center gap-2 cursor-pointer"
                            >
                                <Edit className="w-4 h-4" />
                                修改密碼
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Form method="post" className="w-full">
                                    <input type="hidden" name="intent" value="logout" />
                                    <button
                                        type="submit"
                                        className="w-full flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        登出
                                    </button>
                                </Form>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
