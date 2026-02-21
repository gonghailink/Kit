import { useState } from "react";
import { ChevronDown, Plus, Edit, Trash2, FolderKanban } from "lucide-react";
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
  onCreateWorkspace: () => void;
  onEditWorkspace: (workspace: Workspace) => void;
  onDeleteWorkspace: (workspace: Workspace) => void;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
  onWorkspaceChange,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[200px] justify-between bg-card/70 hover:bg-card/90 border-border"
        >
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium truncate">
              {currentWorkspace?.title || "選擇工作區"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
          工作區
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Workspace List */}
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="flex items-center group">
            <DropdownMenuItem
              className={`flex-1 cursor-pointer ${
                workspace.id === currentWorkspaceId
                  ? "bg-accent text-accent-foreground"
                  : ""
              }`}
              onClick={() => {
                onWorkspaceChange(workspace.id);
                setOpen(false);
              }}
            >
              <FolderKanban className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="truncate">{workspace.title}</span>
              {workspace.id === currentWorkspaceId && (
                <span className="ml-auto text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>

            {/* Edit and Delete buttons - only show on hover */}
            <div className="hidden group-hover:flex items-center gap-1 pr-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditWorkspace(workspace);
                  setOpen(false);
                }}
                className="p-1 hover:bg-accent rounded transition-colors"
                title="編輯工作區"
              >
                <Edit className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {workspaces.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteWorkspace(workspace);
                    setOpen(false);
                  }}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors"
                  title="刪除工作區"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              )}
            </div>
          </div>
        ))}

        <DropdownMenuSeparator />

        {/* Create New Workspace */}
        <DropdownMenuItem
          onClick={() => {
            onCreateWorkspace();
            setOpen(false);
          }}
          className="cursor-pointer text-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>新增工作區</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
