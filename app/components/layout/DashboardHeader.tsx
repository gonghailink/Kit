import { Form } from "react-router";
import { UserIcon, EyeIcon, ShareNetworkIcon, CaretDownIcon, PencilSimpleIcon, SignOutIcon } from "@phosphor-icons/react";
import { ThemeModeToggle } from "~/components/shared/ThemeModeToggle";
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
        <header className="backdrop-blur-sm border-border px-6 pt-4 pb-2">
            {/* First row: Logo, workspace switcher (desktop), and action buttons */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/90 text-primary-foreground shadow-sm">
                            <img src="/favicon-white.svg" alt="Kit" className="h-full w-full p-[1px] object-contain rounded-xl bg-froeground" />
                        </div>
                        <h1 className="text-xl font-semibold text-primary">
                            Kit
                        </h1>
                    </div>
                    {/* Workspace switcher on desktop (hidden on mobile) */}
                    {workspaceSwitcher && (
                        <div className="hidden md:block">
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
                        <ShareNetworkIcon className="w-4 h-4" />
                        <span className="hidden md:block text-xs">分享</span>
                    </Button>
                    <ThemeModeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button onClick={onShare} variant="ghost" className="px-4 py-1 rounded-full bg-transparent shadow-none">
                                <UserIcon className="w-4 h-4" />
                                <CaretDownIcon className="w-4 h-4 opacity-50" />
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
                                <PencilSimpleIcon className="w-4 h-4" />
                                修改密碼
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Form method="post" className="w-full">
                                    <input type="hidden" name="intent" value="logout" />
                                    <button
                                        type="submit"
                                        className="w-full flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                                    >
                                        <SignOutIcon className="w-4 h-4" />
                                        登出
                                    </button>
                                </Form>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Second row: Full width workspace switcher on mobile only */}
            {workspaceSwitcher && (
                <div className="mt-4 md:hidden">
                    {workspaceSwitcher}
                </div>
            )}
        </header>
    );
}
