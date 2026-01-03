
// src/services/storageService.ts
import { Project, CodeVersion, ChatMessage, CodeBundle } from "../types";

export type { Project, CodeVersion, ChatMessage, CodeBundle };

const STORAGE_KEY = "ai_web_builder_v7";

export const storageService = {
  getAllProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveProjects(projects: Project[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  getProject(id: string): Project | null {
    const project = this.getAllProjects().find(p => p.id === id) || null;
    if (project) {
      project.versions.forEach(v => {
        if (!("json" in v.code)) (v.code as any).json = "{}";
      });
    }
    return project;
  },

  createProject(name = "New Project"): Project {
    const projects = this.getAllProjects();

    const welcome: ChatMessage = {
      id: crypto.randomUUID(),
      role: "model",
      content: `# Welcome to **${name}**

I'm your AI web developer.

Tell me what you want to build:
• Modern portfolio
• Restaurant site
• SaaS landing page
• Blog with animations
• Anything!

I'll create a beautiful, responsive site using only 4 files — and you can edit everything in **data.json**.

Just type your idea below`,
      timestamp: Date.now(),
    };

    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      chat: [welcome],
      versions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    projects.unshift(newProject);
    this.saveProjects(projects);
    return newProject;
  },

  updateProject(project: Project) {
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      projects[index] = { ...project, updatedAt: Date.now() };
      this.saveProjects(projects);
    }
  },

  deleteProject(id: string) {
    const projects = this.getAllProjects().filter(p => p.id !== id);
    this.saveProjects(projects);
    return projects;
  },

  addChatMessage(projectId: string, message: ChatMessage) {
    const project = this.getProject(projectId);
    if (project) {
      project.chat.push(message);
      this.updateProject(project);
    }
  },

  addCodeVersion(projectId: string, version: CodeVersion) {
    const project = this.getProject(projectId);
    if (project) {
      project.versions.unshift(version);
      project.versions = project.versions.slice(0, 100);
      this.updateProject(project);
    }
  },
};