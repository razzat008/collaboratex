import React from "react";
import { Link } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { ChevronLeft, Play, Save, Loader2 } from "lucide-react";
import SnapshotControl from "./SnapshotControl";
import {
  useCreateVersion,
  useRestoreVersion,
  useGetProjectWithoutContent,
} from "../../src/graphql/generated";

interface TopBarProps {
  projectName: string;
  projectId?: string;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  autoSave: boolean;
  autoCompile: boolean;
  isCompiling: boolean;
  currentFile: { id: string; name: string; content: string } | null;
  compileState: {
    disabled: boolean;
    text: string;
  };
  onSave: () => void;
  onAutoSaveToggle: () => void;
  onAutoCompileToggle: () => void;
  onCompile: () => void;
  // Called after a version restore completes and TopBar has refetched project data.
  // Optional for consumers that need to run extra logic (e.g. update editor state).
  onAfterRestore?: () => Promise<void> | void;
}

const TopBar: React.FC<TopBarProps> = ({
  projectName,
  projectId,
  isSaving,
  hasUnsavedChanges,
  autoSave,
  autoCompile,
  isCompiling,
  currentFile,
  compileState,
  onSave,
  onAutoSaveToggle,
  onAutoCompileToggle,
  onCompile,
  onAfterRestore,
}) => {
  // Versions / Snapshot GraphQL hooks
  const { data: versionsData, refetch } = useGetProjectWithoutContent({
    variables: { id: projectId ?? "" },
    skip: !projectId,
    fetchPolicy: "network-only",
  });

  const [createVersion] = useCreateVersion();
  const [restoreVersion] = useRestoreVersion();

  const versions =
    (versionsData?.project?.versions ?? []).map((v: any) => ({
      id: v.id,
      createdAt: v.createdAt,
      message: v.message,
    })) ?? [];

  return (
    <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-2 shadow-sm">
      {/* Left: Project Info */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xs font-semibold text-slate-800">
            {projectName}
          </h1>
          <p className="text-xs text-slate-500">ID: {projectId}</p>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Save Status */}
        {isSaving && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Loader2 size={14} className="animate-spin" />
            Saving...
          </div>
        )}
        {!isSaving && hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          className="flex items-center gap-2 px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-lg transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          Save
        </button>

        {/* Snapshot / Versions control */}
        <SnapshotControl
          versions={versions}
          onCreate={async (message?: string) => {
            if (!projectId) return;
            await createVersion({
              variables: { input: { projectId, message } },
            });
            await refetch();
          }}
          onRestore={async (versionId: string) => {
            await restoreVersion({ variables: { versionId } });
            await refetch();
            if (onAfterRestore) await onAfterRestore();
          }}
        />

        {/* Auto Save Toggle */}
        <div className="flex items-center gap-1 px-1 py-1 text-xs text-slate-700 border border-slate-200 rounded-lg">
          <span>Auto Save</span>
          <button
            onClick={onAutoSaveToggle}
            className={`w-8 h-4 rounded-full transition-colors relative ${
              autoSave ? "bg-green-600" : "bg-slate-300"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                autoSave ? "translate-x-4" : ""
              }`}
            />
          </button>
        </div>

        {/* Auto Compile Toggle */}
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 border border-slate-200 rounded-lg">
          <span>Auto Compile</span>
          <button
            onClick={onAutoCompileToggle}
            className={`w-8 h-4 rounded-full transition-colors relative ${
              autoCompile ? "bg-green-600" : "bg-slate-300"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                autoCompile ? "translate-x-4" : ""
              }`}
            />
          </button>
        </div>

        {/* Compile Button */}
        <button
          onClick={onCompile}
          disabled={compileState.disabled}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
          title={
            compileState.disabled
              ? "Select a file to compile"
              : "Compile project"
          }
        >
          {isCompiling ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          {compileState.text}
        </button>
        <UserButton />
      </div>
    </div>
  );
};

export default TopBar;
