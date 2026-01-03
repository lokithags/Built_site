
// src/App.tsx
import React, { useState, useEffect } from "react";
import VSCodeIDE from "./components/VSCodeIDE";
import PreviewPane from "./components/PreviewPane";
import ChatMessageComponent from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import ProjectHistory from "./components/ProjectHistory";
import { storageService } from "./services/storageService";
import { sendMessageToAI } from "./services/chatService";
import { codeBundleToFiles } from "./utils/parseCode";
import { Project, FileNode } from "./types";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Plus, Download, Code2, Eye, Sparkles, Maximize2, Minimize2 } from "lucide-react";

export const aiBuilderPrompts: string[] = [
  "Imagine your website as the stage for your ideas—bold, unique, and unforgettable. Let's make it happen!",
  "Your next website could be a cinematic landing page that draws visitors in with drama and clarity.",
  "Think of a site that tells a story: each scroll is a new chapter. What story will yours tell?",
  "Bold typography, striking visuals, and minimal clutter—your site can make an instant impression.",
  "From personal portfolios to product showcases, your website can become a living, breathing brand.",
  "Every great website starts with one idea. What's yours today? We'll help bring it to life.",
  "Consider interactive experiences, not just static pages—hover effects, subtle animations, and transitions can make your site unforgettable.",
  "Even a single-page site can feel like a journey. Let’s craft each section to resonate with your audience.",
  "Your website is your digital handshake—make it firm, confident, and inviting.",
  "Looking for inspiration? How about a one-page cinematic portfolio, an immersive product landing page, or a visually dramatic event showcase?",
  "Let’s think outside the box: a storytelling blog, a portfolio with animated stats, or a digital gallery that feels alive.",
  "Your ideas deserve a stage. Even a simple site can radiate professionalism and style.",
  "Think of the first impression: what’s the one thing visitors should feel when they land on your page?",
  "Every color, font, and layout choice can convey emotion. Let’s create a website that speaks without words.",
  "Even if you’re unsure where to start, we can explore multiple creative directions together and see what clicks.",
  "Your website can be an experience, not just a page. Interactive, cinematic, and unforgettable—let’s build it."
];

const MIN_CHAT_WIDTH = 260;
const MAX_CHAT_WIDTH = 480;
const DEFAULT_CHAT_WIDTH = 320;

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [view, setView] = useState<"code" | "preview">("preview");
  const [showHistory, setShowHistory] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [currentFiles, setCurrentFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatWidth, setChatWidth] = useState(() => {
    const saved = localStorage.getItem("chatWidth");
    return saved ? Number(saved) : DEFAULT_CHAT_WIDTH;
  });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Landing page state
  const [showLanding, setShowLanding] = useState(true);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // Cycle through prompts every 4 seconds
  useEffect(() => {
    if (!showLanding) return;
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % aiBuilderPrompts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [showLanding]);

  useEffect(() => {
    const all = storageService.getAllProjects();
    setProjects(all);

    const lastId = localStorage.getItem("lastProjectId");
    let project = lastId ? storageService.getProject(lastId) : null;

    if (!project && all.length > 0) project = all[0];
    if (!project) {
      project = storageService.createProject("My First App");
      setProjects(storageService.getAllProjects());
    }

    setCurrentProject(project);
    localStorage.setItem("lastProjectId", project.id);
    loadFiles(project);
  }, []);

  const loadFiles = (project: Project) => {
    if (project.versions[0]) {
      setCurrentFiles(codeBundleToFiles(project.versions[0].code));
    } else {
      setCurrentFiles(
        // codeBundleToFiles({
        //   html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${project.name}</title><link rel="stylesheet" href="styles.css"></head><body><div class="container"><h1>Welcome!</h1><p>Ask AI to build anything...</p></div><script src="script.js"></script></body></html>`,
        //   css: `*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;background:#0f172a;color:white;min-height:100vh;display:grid;place-items:center}.container{text-align:center;padding:3rem;background:rgba(255,255,255,.08);border-radius:24px}`,
        //   js: `console.log("Ready!")`,
        //   json: "{}",
        // })
        codeBundleToFiles({
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\${project.name}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <div class="bg-effects" id="starfield"></div>

  <div class="container">
    <h1>Multi Agent WebSite Creation</h1>
    <p>
      Describe your vision in the chat and watch cinematic, professional websites
      come to life instantly.
    </p>
  </div>

  <script src="script.js"></script>
</body>
</html>`,

  css: `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Inter:wght@400;600&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: radial-gradient(circle at center, #020111, #000);
  color: #e0e0ff;
  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
}

/* ================= CONTENT ================= */
.container {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 800px;
  position: relative;
  z-index: 10;
}

h1 {
  font-family: 'Orbitron', sans-serif;
  font-size: 5rem;
  background: linear-gradient(90deg, #00ffea, #ff00c8, #ffcc00);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
  animation: glow 3s ease-in-out infinite alternate;
}

p {
  font-size: 1.8rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* ================= STARFIELD ================= */
.bg-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  width: var(--size);
  height: var(--size);
  opacity: var(--opacity);
  filter: blur(var(--blur));
  animation:
    drift var(--duration) linear infinite,
    twinkle calc(var(--duration) / 2.5) ease-in-out infinite alternate;
}

/* Random drift vector — no fixed origin */
@keyframes drift {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(var(--dx), var(--dy));
  }
}

@keyframes twinkle {
  from {
    opacity: calc(var(--opacity) * 0.5);
  }
  to {
    opacity: var(--opacity);
  }
}

@keyframes glow {
  from {
    text-shadow: 0 0 20px rgba(0, 255, 234, 0.4);
  }
  to {
    text-shadow: 0 0 45px rgba(255, 0, 200, 0.9);
  }
}`,

  js: `const starfield = document.getElementById("starfield");

const STAR_COUNT = 200;

for (let i = 0; i < STAR_COUNT; i++) {
  const star = document.createElement("div");
  star.className = "star";

  const size = Math.random() * 2.5 + 0.5;
  const opacity = Math.random() * 0.6 + 0.3;
  const blur = Math.random() * 1.5;
  const duration = Math.random() * 40 + 20;

  const dx = (Math.random() - 0.5) * 200;
  const dy = (Math.random() - 0.5) * 200;

  star.style.left = Math.random() * 100 + "vw";
  star.style.top = Math.random() * 100 + "vh";

  star.style.setProperty("--size", size + "px");
  star.style.setProperty("--opacity", opacity);
  star.style.setProperty("--blur", blur + "px");
  star.style.setProperty("--duration", duration + "s");
  star.style.setProperty("--dx", dx + "px");
  star.style.setProperty("--dy", dy + "px");

  starfield.appendChild(star);
}

console.log("🌌 Randomized starfield initialized.");`,

  json: "{}",
})
      );
    }
  };

  const createProject = () => {
    if (!newProjectName.trim()) return;

    const p = storageService.createProject(newProjectName.trim());
    setProjects(storageService.getAllProjects());
    setCurrentProject(p);
    loadFiles(p);
    localStorage.setItem("lastProjectId", p.id);
    setShowNewProject(false);
    setNewProjectName("");
  };

  const deleteProject = (id: string) => {
    const updated = storageService.deleteProject(id);
    setProjects(updated);

    if (currentProject?.id === id) {
      const next = updated[0] || storageService.createProject("New Project");
      setCurrentProject(next);
      loadFiles(next);
      localStorage.setItem("lastProjectId", next.id);
    }
  };

  const switchProject = (p: Project) => {
    setCurrentProject(p);
    loadFiles(p);
    localStorage.setItem("lastProjectId", p.id);
    setShowHistory(false);
  };

  const handleSend = async (msg: string, mode: "plan" | "code") => {
    if (!currentProject || isLoading) return;
    setIsLoading(true);

    await sendMessageToAI(currentProject.id, msg, mode, () => {
      const updated = storageService.getProject(currentProject.id);
      if (updated) {
        setCurrentProject(updated);
        if (updated.versions[0]) {
          setCurrentFiles(codeBundleToFiles(updated.versions[0].code));
        }
      }
    });

    setIsLoading(false);
  };

  const handleRollback = (versionId: string) => {
    if (!currentProject) return;

    const version = currentProject.versions.find(v => v.id === versionId);
    if (!version) return;

    storageService.addCodeVersion(currentProject.id, {
      ...version,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });

    const updated = storageService.getProject(currentProject.id);
    if (updated) {
      setCurrentProject(updated);
      setCurrentFiles(codeBundleToFiles(updated.versions[0].code));
    }
  };

  const download = () => {
    const zip = new JSZip();
    const add = (nodes: FileNode[], folder: JSZip) => {
      nodes.forEach(n => {
        if (n.type === "folder" && n.children) add(n.children, folder.folder(n.name)!);
        else if (n.content !== undefined) folder.file(n.name, n.content);
      });
    };
    add(currentFiles, zip);
    zip.generateAsync({ type: "blob" }).then(b =>
      saveAs(b, `${currentProject?.name}.zip`)
    );
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatWidth;
    document.body.style.cursor = "col-resize";

    const onMouseMove = (e: MouseEvent) => {
      const next = Math.min(
        MAX_CHAT_WIDTH,
        Math.max(MIN_CHAT_WIDTH, startWidth + (e.clientX - startX))
      );
      setChatWidth(next);
    };

    const onMouseUp = () => {
      localStorage.setItem("chatWidth", String(chatWidth));
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const enterWorkspace = () => {
    setShowLanding(false);
  };

  if (showLanding) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-purple-900/10 to-gray-950" />
        <div className="absolute inset-0 backdrop-blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <div className="mb-12">
            <div className="flex justify-center mb-6">
              <Sparkles className="w-16 h-16 text-cyan-400" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Multi Agent WebSite Creation
            </h1>
            <p className="text-xl text-gray-400">
              Creating website with ease
            </p>
          </div>

          <div className="h-32 flex items-center justify-center mb-12">
            <p className="text-2xl text-gray-300 leading-relaxed max-w-3xl px-8 animate-fade-in">
              {aiBuilderPrompts[currentPromptIndex]}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => {
                setShowNewProject(true);
                enterWorkspace();
              }}
              className="group flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black text-lg font-bold rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/25"
            >
              <Plus size={28} />
              Create New Project
            </button>

            {projects.length > 0 && (
              <button
                onClick={enterWorkspace}
                className="px-8 py-5 bg-gray-800/80 backdrop-blur border border-gray-700 hover:bg-gray-700/80 text-white text-lg font-semibold rounded-2xl shadow-xl transition-all duration-300"
              >
                Continue Working →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-300 text-2xl">
        Loading workspace…
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
        {/* CHAT PANEL */}
        <div
          className="relative bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 flex flex-col"
          style={{ width: `${chatWidth}px` }}
        >
          <div className="p-5 border-b border-gray-800 flex justify-between items-center">
            <button
              onClick={() => setShowHistory(true)}
              className="text-cyan-400 font-semibold text-lg px-3 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl font-semibold transition active:scale-95"
            >
              <Plus size={18} /> New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-7">
            {currentProject.chat.map(m => (
              <ChatMessageComponent
                key={m.id}
                message={m}
                onRollback={handleRollback}
              />
            ))}
            {isLoading && (
              <div className="text-center text-gray-400 text-sm animate-pulse">
                Generating response…
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-800">
            <ChatInput onSendMessage={handleSend} isLoading={isLoading} />
          </div>

          {/* RESIZE HANDLE */}
          <div
            onMouseDown={startResize}
            className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-cyan-500/20 transition"
          >
            <div className="h-full w-px bg-gray-700 mx-auto" />
          </div>
        </div>

        {/* EDITOR / PREVIEW */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-sm">
            <h1 className="text-lg font-semibold">{currentProject.name}</h1>

            <div className="flex items-center gap-4">
              <div className="relative bg-gray-800 rounded-xl p-1 flex">
                <div
                  className={`absolute top-1 bottom-1 left-1 w-1/2 bg-cyan-500 rounded-lg transition-transform duration-300 ${
                    view === "preview" ? "translate-x-full" : ""
                  }`}
                />
                <button
                  onClick={() => setView("code")}
                  className="relative z-10 w-32 flex items-center justify-center gap-2 py-2 text-sm font-medium"
                >
                  <Code2 size={16} /> Editor
                </button>
                <button
                  onClick={() => setView("preview")}
                  className="relative z-10 w-32 flex items-center justify-center gap-2 py-2 text-sm font-medium"
                >
                  <Eye size={16} /> Preview
                </button>
              </div>

              {view === "preview" && (
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition active:scale-95"
                  title="Fullscreen Preview"
                >
                  <Maximize2 size={18} />
                </button>
              )}

              <button
                onClick={download}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition active:scale-95"
              >
                <Download size={18} /> Download
              </button>
            </div>
          </div>

          {view === "code" ? (
            <VSCodeIDE projectId={currentProject.id} onFilesChange={setCurrentFiles} />
          ) : (
            <div className="flex-1 p-4 bg-gray-950">
              <div className="h-full bg-white rounded-xl border border-gray-200 shadow-inner overflow-hidden">
                <PreviewPane files={currentFiles} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Overlay */}
      {isFullscreen && view === "preview" && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
          {/* Top bar */}
          <div className="bg-gray-900/90 backdrop-blur border-b border-gray-800 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-200">
              Fullscreen Preview – {currentProject.name}
            </h2>
            <button
              onClick={() => setIsFullscreen(false)}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition active:scale-95"
            >
              <Minimize2 size={18} className="group-hover:rotate-12 transition" />
              Exit Fullscreen
            </button>
          </div>

          {/* Preview content */}
          <div className="flex-1 bg-white">
            <PreviewPane files={currentFiles} />
          </div>
        </div>
      )}

      {/* Project History Modal */}
      {showHistory && (
        <ProjectHistory
          projects={projects}
          currentProject={currentProject}
          onSelectProject={switchProject}
          onClose={() => setShowHistory(false)}
          onDeleteProject={deleteProject}
        />
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-10 w-full max-w-md">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-100">New Project</h2>
            <p className="text-center text-gray-400 mb-6">Give your project a name</p>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createProject()}
              placeholder="Project name..."
              className="w-full px-6 py-4 bg-gray-800 border border-gray-700 rounded-xl text-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              autoFocus
            />
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowNewProject(false);
                  setNewProjectName("");
                }}
                className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-bold text-black transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;