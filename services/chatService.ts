

// src/services/chatService.ts
import { v4 as uuidv4 } from "uuid";
import { generateWebApp } from "./geminiService"; // or groqService, depending on your setup
import { storageService } from "./storageService";
import { ChatMessage, CodeVersion, CodeBundle } from "../types";

function getChangedFiles(oldCode: CodeBundle | null, newCode: CodeBundle): string[] {
  if (!oldCode) return ["index.html", "styles.css", "script.js", "data.json"];

  const changed: string[] = [];
  if (oldCode.html !== newCode.html) changed.push("index.html");
  if (oldCode.css !== newCode.css) changed.push("styles.css");
  if (oldCode.js !== newCode.js) changed.push("script.js");
  if (oldCode.json !== newCode.json) changed.push("data.json");
  return changed;
}

function generateChangeSummary(changedFiles: string[]): string {
  if (changedFiles.length === 0) return "No changes.";
  if (changedFiles.length === 4) return "Created full project from scratch.";
  return `Updated ${changedFiles.length} file${changedFiles.length > 1 ? "s" : ""}`;
}

export const sendMessageToAI = async (
  projectId: string,
  userMessage: string,
  mode: "plan" | "code" | "chat", // ← Now includes "chat"
  onUpdate?: (msg: ChatMessage) => void
) => {
  const project = storageService.getProject(projectId);
  if (!project) return;

  const userMsg: ChatMessage = {
    id: uuidv4(),
    role: "user",
    content: userMessage,
    timestamp: Date.now(),
  };
  storageService.addChatMessage(projectId, userMsg);
  onUpdate?.(userMsg);

  try {
    // ==================== CHAT MODE ====================
    if (mode === "chat") {
      const responses = [
        `Got it: "${userMessage}"\n\nI'm here to chat, brainstorm ideas, give feedback, or just keep you company while you build something amazing. What’s on your mind? 😊`,
        `"${userMessage}" — nice!\n\nWant to talk design trends, animation ideas, color palettes, or just vibe? I'm all in. ✨`,
        `Love hearing from you: "${userMessage}"\n\nThis project is going to be epic. Need a creative spark? Just say the word! 🚀`,
        `Message received: "${userMessage}"\n\nYou're crushing it. Anything I can help with — big picture or tiny detail? 💡`,
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];

      const chatResponse: ChatMessage = {
        id: uuidv4(),
        role: "model",
        content: randomResponse,
        timestamp: Date.now(),
      };

      storageService.addChatMessage(projectId, chatResponse);
      onUpdate?.(chatResponse);
      return;
    }

    // ==================== PLAN & CODE MODES ====================
    const currentCode = project.versions[0]?.code || null;
    const isFirstMessage = project.versions.length === 0;

    const result = await generateWebApp(userMessage, {
      currentCode,
      isFirstMessage,
      mode: mode as "plan" | "code", // safe cast since we handled "chat" above
    });

    if (result.type === "plan") {
      const planMsg: ChatMessage = {
        id: uuidv4(),
        role: "model",
        content: result.content,
        timestamp: Date.now(),
      };
      storageService.addChatMessage(projectId, planMsg);
      onUpdate?.(planMsg);
      return;
    }

    // CODE MODE
    if (result.type === "code") {
      const newCode = result.code;
      const changedFiles = getChangedFiles(currentCode, newCode);
      const summary = generateChangeSummary(changedFiles);

      const newVersion: CodeVersion = {
        id: uuidv4(),
        code: newCode,
        prompt: userMessage,
        timestamp: Date.now(),
        changedFiles,
        changesSummary: summary,
      };

      storageService.addCodeVersion(projectId, newVersion);

      const aiMsg: ChatMessage = {
        id: uuidv4(),
        role: "model",
        content: `**Website updated!**\n\n${summary}\n\nYour changes are now live in the preview and editor.`,
        versionId: newVersion.id,
        isCodeUpdate: true,
        changedFiles,
        changesSummary: summary,
        timestamp: Date.now(),
      };

      storageService.addChatMessage(projectId, aiMsg);
      onUpdate?.(aiMsg);
    }
  } catch (error: any) {
    const errMsg: ChatMessage = {
      id: uuidv4(),
      role: "error",
      content: `AI Error: ${error.message || "Something went wrong."}`,
      timestamp: Date.now(),
    };
    storageService.addChatMessage(projectId, errMsg);
    onUpdate?.(errMsg);
  }
};