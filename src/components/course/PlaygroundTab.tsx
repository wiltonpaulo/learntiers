'use client'

import { useState, useMemo } from "react";
import { SandpackProvider, SandpackCodeEditor } from "@codesandbox/sandpack-react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Code2, FileCode } from "lucide-react";
import { generatePlaygroundCodeAction } from "@/lib/actions/ai";

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
 * PlaygroundTab - Multi-language support with AI detection.
 */
export function PlaygroundTab({ sectionId, initialCode }: PlaygroundTabProps) {
  // Parse initial code (it might be a JSON string with filename and code)
  const parsedInitial = useMemo(() => {
    if (!initialCode) return { filename: DEFAULT_FILENAME, code: DEFAULT_CODE };
    try {
      const parsed = JSON.parse(initialCode);
      if (parsed.filename && parsed.code) return parsed;
    } catch (e) {
      // If it's not JSON, it's legacy raw code (React)
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

  return (
    <div className="flex flex-col w-full h-full min-h-[550px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151515] animate-in fade-in duration-500">
      
      {/* Header with AI Action */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Interactive Code</span>
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <FileCode className="w-3 h-3" /> {fileData.filename}
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleGenerateCode}
          disabled={isGenerating}
          className="h-8 text-[11px] font-bold gap-2 shadow-sm border-primary/20 hover:bg-primary/5 transition-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyzing Lesson...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-primary fill-primary/20" />
              {fileData.code === DEFAULT_CODE ? "Generate Example" : "Detect & Regenerate"}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-[10px] text-destructive border-b border-destructive/20 font-medium">
          {error}
        </div>
      )}

      {/* Dynamic Code Editor */}
      <div className="flex-1 min-h-0 relative">
        <SandpackProvider
          key={`${fileData.filename}-${fileData.code.length}`} // Force reset when file changes
          theme="dark"
          files={{
            [`/${fileData.filename}`]: { code: fileData.code, active: true },
          }}
          options={{
            classes: {
              "sp-wrapper": "h-full",
              "sp-layout": "h-full border-none",
            }
          }}
        >
          <SandpackCodeEditor 
            showTabs={false} 
            showLineNumbers={true} 
            showInlineErrors={true}
            style={{ height: "100%" }}
          />
        </SandpackProvider>
      </div>
      
      {/* Minimalist footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest font-medium shrink-0">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          AI Detected Language
        </span>
        <span className="opacity-50">Editor Mode</span>
      </div>
    </div>
  );
}
