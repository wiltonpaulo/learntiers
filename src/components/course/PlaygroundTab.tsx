'use client'

import { useState, useMemo, useRef, useEffect } from "react";
import { SandpackProvider, SandpackCodeEditor } from "@codesandbox/sandpack-react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Code2, FileCode, Copy, Check, Maximize2, Minimize2, Download, ExternalLink } from "lucide-react";
import { generatePlaygroundCodeAction } from "@/lib/actions/ai";
import { cn } from "@/lib/utils";
import LZString from "lz-string";

interface PlaygroundTabProps {
  sectionId: string;
  initialCode?: string | null;
}

const DEFAULT_FILENAME = "App.js";
const DEFAULT_CODE = `export default function App() {
  return (
    <div>
      <h1>No code generated yet.</h1>
      <p>Use the AI button to generate code based on this lesson!</p>
    </div>
  );
}`;

/**
 * PlaygroundTab - High-end version with site-matching styles, copy, download, fullscreen and sandbox.
 */
export function PlaygroundTab({ sectionId, initialCode }: PlaygroundTabProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsedInitial = useMemo(() => {
    if (!initialCode) return { filename: DEFAULT_FILENAME, code: DEFAULT_CODE };
    try {
      const parsed = JSON.parse(initialCode);
      if (parsed.filename && parsed.code) return parsed;
    } catch (e) {
      return { filename: "App.js", code: initialCode };
    }
    return { filename: DEFAULT_FILENAME, code: DEFAULT_CODE };
  }, [initialCode]);

  const [fileData, setFileData] = useState(parsedInitial);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generatePlaygroundCodeAction(sectionId);
      if (result.success && result.code) {
        setFileData({
          filename: result.filename || "script.js",
          code: result.code
        });
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to reach AI service.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fileData.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenSandbox = () => {
    const isReact = /\.[jt]sx?$/.test(fileData.filename);
    
    const parameters = {
      files: {
        "package.json": {
          content: JSON.stringify({
            dependencies: isReact ? {
              react: "latest",
              "react-dom": "latest",
              "lucide-react": "latest"
            } : {}
          }, null, 2)
        },
        [fileData.filename]: {
          content: fileData.code,
          active: true
        }
      },
      // module parameter inside query focuses the file in the editor
      query: `module=/${fileData.filename}`
    };

    // Se for React, adicionamos o bootstrap para não dar erro de preview se o user ativar
    if (isReact) {
      (parameters.files as any)["index.js"] = {
        content: `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./${fileData.filename.replace(/\.[jt]sx?$/, "")}";\n\nconst root = createRoot(document.getElementById("root"));\nroot.render(<App />);`
      };
    }

    const encodedParams = LZString.compressToBase64(JSON.stringify(parameters))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const form = document.createElement("form");
    form.method = "POST";
    // view=editor esconde o preview por padrão
    // file=... força o foco no arquivo da IA
    form.action = `https://codesandbox.io/api/v1/sandboxes/define?view=editor&file=/${fileData.filename}`;
    form.target = "_blank";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "parameters";
    input.value = encodedParams;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isFullscreen]);

  const isDefaultCode = fileData.code === DEFAULT_CODE;

  return (
    <div 
      className={cn(
        "flex flex-col w-full h-full min-h-[550px] overflow-hidden rounded-xl border transition-all duration-500",
        "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a]",
        isFullscreen 
          ? "fixed inset-0 z-[1000] rounded-none border-none h-screen w-screen" 
          : "relative"
      )}
    >
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Lesson Code</span>
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <FileCode className="w-3 h-3 text-primary/60" /> {fileData.filename}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleOpenSandbox} 
            disabled={isDefaultCode}
            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30" 
            title="Open in CodeSandbox"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDownload} 
            disabled={isDefaultCode}
            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30" 
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCopy} 
            disabled={isDefaultCode}
            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30" 
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFullscreen} 
            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" 
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
          <Button variant="outline" size="sm" onClick={handleGenerateCode} disabled={isGenerating} className="h-8 text-[11px] font-bold gap-2 shadow-sm border-primary/20 hover:bg-primary/5 dark:text-slate-200 transition-all">
            {isGenerating ? <><Loader2 className="w-3 h-3 animate-spin" />Writing...</> : <><Sparkles className="w-3 h-3 text-primary fill-primary/20" />{isDefaultCode ? "Generate" : "Regenerate"}</>}
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-[10px] text-destructive border-b border-destructive/20 font-medium">{error}</div>
      )}

      {/* Dynamic Code Editor - Fixed Scroll */}
      <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
        <SandpackProvider
          key={`${fileData.filename}-${fileData.code.length}`}
          theme="dark"
          files={{
            [`/${fileData.filename}`]: { code: fileData.code, active: true },
          }}
          options={{
            classes: {
              "sp-wrapper": "h-full flex-1",
              "sp-layout": "h-full flex-1 border-none",
              "sp-stack": "h-full flex-1"
            }
          }}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <SandpackCodeEditor 
            showTabs={false} 
            showLineNumbers={true} 
            showInlineErrors={true}
            style={{ 
              height: "100%", 
              backgroundColor: "transparent",
              fontSize: "13px",
              fontFamily: 'var(--font-geist-mono), monospace'
            }}
          />
        </SandpackProvider>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 text-[10px] text-slate-500 uppercase tracking-widest font-medium shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" />AI Ready</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" />LearnTiers IDE</span>
        </div>
        <span className="opacity-50">{isFullscreen ? "Press ESC to exit" : fileData.filename}</span>
      </div>
    </div>
  );
}
