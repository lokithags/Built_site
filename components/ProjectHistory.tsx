

import React, { useCallback, useEffect, useState } from "react";
import { Project } from "../types";
import { Trash2, X } from "lucide-react";

interface Props {
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (project: Project) => void;
  onClose: () => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectHistory: React.FC<Props> = ({
  projects,
  currentProject,
  onSelectProject,
  onClose,
  onDeleteProject,
}) => {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const isConfirmValid =
    projectToDelete && confirmName === projectToDelete.name;

  const closeDeleteModal = useCallback(() => {
    setProjectToDelete(null);
    setConfirmName("");
  }, []);

  const handleDelete = useCallback(() => {
    if (!projectToDelete || !isConfirmValid) return;
    onDeleteProject(projectToDelete.id);
    closeDeleteModal();
  }, [projectToDelete, isConfirmValid, onDeleteProject, closeDeleteModal]);

  // Escape key support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        projectToDelete ? closeDeleteModal() : onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [projectToDelete, closeDeleteModal, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-lg flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-gray-100">
            Projects{" "}
            <span className="text-cyan-400">({projects.length})</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close project history"
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
          {projects.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No projects yet. Create one to get started.
            </div>
          )}

          {projects.map((project) => {
            const isActive = currentProject?.id === project.id;

            return (
              <div
                key={project.id}
                className={`px-6 py-5 flex items-center justify-between transition ${
                  isActive
                    ? "bg-cyan-500/10 border-l-4 border-cyan-500"
                    : "hover:bg-gray-800/60"
                }`}
              >
                <button
                  type="button"
                  disabled={!!projectToDelete}
                  onClick={() => onSelectProject(project)}
                  className="flex-1 text-left disabled:opacity-60"
                >
                  <div className="text-lg font-semibold text-gray-100">
                    {project.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Updated{" "}
                    {new Date(project.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    • {project.chat.length} message
                    {project.chat.length !== 1 && "s"}
                  </div>
                </button>

                <button
                  type="button"
                  aria-label={`Delete project ${project.name}`}
                  onClick={() => {
                    setProjectToDelete(project);
                    setConfirmName("");
                  }}
                  className="ml-4 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* DELETE CONFIRM MODAL */}
        {projectToDelete && (
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={closeDeleteModal}
          >
            <div
              className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 bg-red-900/20 rounded-full flex items-center justify-center">
                  <Trash2 size={28} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-100">
                  Delete project?
                </h3>
                <p className="text-gray-400 mt-2">
                  This action cannot be undone.
                </p>
              </div>

              <p className="text-sm text-gray-300 text-center mb-4">
                Type{" "}
                <span className="font-mono text-cyan-400 bg-gray-800 px-2 py-1 rounded">
                  {projectToDelete.name}
                </span>{" "}
                to confirm
              </p>

              <input
                autoFocus
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!isConfirmValid}
                  className={`flex-1 py-3 rounded-xl font-semibold transition ${
                    isConfirmValid
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectHistory;
