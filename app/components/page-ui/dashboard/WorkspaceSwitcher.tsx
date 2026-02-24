import { useState } from "react";
import { CaretDown, GearSix, SquaresFour } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";

export interface Workspace {
  id: string;
  title: string;
  user_id: string;
  sort_order: number | null;
  created_at: string;
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  onWorkspaceChange: (workspaceId: string) => void;
  onManageWorkspaces?: () => void;
  allowEdit?: boolean;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
  onWorkspaceChange,
  onManageWorkspaces,
  allowEdit = false,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 w-full md:min-w-[200px] justify-between bg-card/70 hover:bg-card/90 border-0 shadow-none rounded-full"
        >
          <div className="flex items-center gap-2">
            <SquaresFour className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium truncate">
              {currentWorkspace?.title || "選擇工作區"}
            </span>
          </div>
          <CaretDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[calc(100vw-3rem)] md:w-[280px] space-y-0.5">
        <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
          工作區
        </DropdownMenuLabel>

        {/* Workspace List */}
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            className={`cursor-pointer rounded-2xl ps-3 ${workspace.id === currentWorkspaceId
              ? "bg-primary/20 text-foreground"
              : "hover:bg-primary/10"
              }`}
            onClick={() => {
              onWorkspaceChange(workspace.id);
              setOpen(false);
            }}
          >
            <SquaresFour className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{workspace.title}</span>
          </DropdownMenuItem>
        ))}

        {allowEdit && onManageWorkspaces && (
          <>
            {/* Manage Workspaces */}
            <DropdownMenuItem
              onClick={() => {
                onManageWorkspaces();
                setOpen(false);
              }}
              className="mt-2 cursor-pointer text-primary hover:text-primary hover:font-bold"
            >
              <GearSix className="w-4 h-4" />
              <span>管理工作區</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
