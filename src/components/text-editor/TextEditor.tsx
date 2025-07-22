/* ==========================================================================*/
// TextEditor.tsx — Enhanced text editor with comprehensive toolbar
/* ==========================================================================*/
// Purpose: Rich text editor with floating and fixed toolbar functionality
// Sections: Imports, Types, Component, Exports

"use client";

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import { useState, useEffect } from "react";

// Lexical core ---
import { SerializedEditorState, $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { ParagraphNode, TextNode } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

// Local Modules ---
import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { FloatingTextFormatToolbarPlugin } from "@/components/editor/plugins/floating-text-format-plugin";
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import { FontColorToolbarPlugin } from "@/components/editor/plugins/toolbar/font-color-toolbar-plugin";
import { FontBackgroundToolbarPlugin } from "@/components/editor/plugins/toolbar/font-background-toolbar-plugin";
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin";
import { FormatParagraph } from "@/components/editor/plugins/toolbar/block-format/format-paragraph";
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading";
import { FormatQuote } from "@/components/editor/plugins/toolbar/block-format/format-quote";
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list";
import { FormatNumberedList } from "@/components/editor/plugins/toolbar/block-format/format-numbered-list";
import { FormatCheckList } from "@/components/editor/plugins/toolbar/block-format/format-check-list";
import { ToolbarContext } from "@/components/editor/context/toolbar-context";
import { editorTheme } from "@/components/editor/themes/editor-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// Icons ---
import { Maximize2, Minimize2 } from "lucide-react";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface TextEditorProps {
  initialContent?: SerializedEditorState;
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const editorConfig: InitialConfigType = {
  namespace: "RichTextEditor",
  theme: editorTheme,
  nodes: [HeadingNode, ParagraphNode, TextNode, QuoteNode, ListNode, ListItemNode],
  onError: (error: Error) => {
    console.error("Lexical Editor Error:", error);
  },
};

/* ==========================================================================*/
// Helper Components
/* ==========================================================================*/

/**
 * ContentUpdatePlugin
 * 
 * Plugin to update editor content when the content prop changes
 */
function ContentUpdatePlugin({ content }: { content?: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (content !== undefined) {
      editor.update(() => {
        const root = $getRoot();
        const currentText = root.getTextContent();
        
        // Only update if content has actually changed
        if (currentText !== content) {
          root.clear();
          
          if (content.trim()) {
            const paragraph = $createParagraphNode();
            const textNode = $createTextNode(content);
            paragraph.append(textNode);
            root.append(paragraph);
          }
        }
      });
    }
  }, [content, editor]);

  return null;
}

/* ==========================================================================*/
// Components
/* ==========================================================================*/

/**
 * ToolbarPlugins
 *
 * Component that renders the fixed toolbar with all formatting options
 */
function ToolbarPlugins({ expanded, onExpandToggle }: { expanded: boolean; onExpandToggle: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b bg-background p-2">
      {/* Block Format */}
      <BlockFormatDropDown>
        <FormatParagraph />
        <FormatHeading levels={["h1", "h2", "h3"]} />
        <FormatQuote />
        <FormatBulletedList />
        <FormatNumberedList />
        <FormatCheckList />
      </BlockFormatDropDown>
      
      <Separator orientation="vertical" className="mx-2 h-6" />
      
      {/* Font Formatting */}
      <div className="flex items-center gap-1">
        <FontFormatToolbarPlugin format="bold" />
        <FontFormatToolbarPlugin format="italic" />
        <FontFormatToolbarPlugin format="underline" />
        {/* <FontFormatToolbarPlugin format="strikethrough" /> */}
        <FontFormatToolbarPlugin format="code" />
      </div>
      
      <Separator orientation="vertical" className="mx-2 h-6" />
      
      {/* Colors */}
      <div className="flex items-center gap-1">
        <FontColorToolbarPlugin />
        <FontBackgroundToolbarPlugin />
      </div>
      
      <Separator orientation="vertical" className="mx-2 h-6" />
      
      {/* Expand/Minimize Button */}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpandToggle}
          className="h-8 w-8 p-0"
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

/**
 * EditorPlugins
 *
 * Component that manages all editor plugins including floating toolbar
 */
function EditorPlugins({ 
  onChange, 
  placeholder, 
  expanded, 
  onExpandToggle,
  content 
}: { 
  onChange?: (content: string) => void; 
  placeholder?: string; 
  expanded: boolean;
  onExpandToggle: () => void;
  content?: string;
}) {
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <div className="relative">
      {/* Fixed Toolbar */}
      <ToolbarPlugins expanded={expanded} onExpandToggle={onExpandToggle} />

      {/* Editor Content */}
      <div className={`relative transition-all duration-200 ${
        expanded ? "min-h-fit" : "min-h-[400px] max-h-[400px] overflow-y-auto"
      }`}>
        <RichTextPlugin
          contentEditable={
            <div className="relative h-full">
              <div ref={onRef} className="h-full">
                <ContentEditable
                  placeholder={placeholder || "Start typing..."}
                  className={`ContentEditable__root relative block px-6 py-4 focus:outline-none ${
                    expanded 
                      ? "min-h-[300px]" 
                      : "min-h-full"
                  }`}
                />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        
        {/* Content Update Plugin */}
        <ContentUpdatePlugin content={content} />
        
        {/* OnChange Plugin */}
        {onChange && (
          <OnChangePlugin
            onChange={(editorState) => {
              editorState.read(() => {
                // Get the text content using Lexical's built-in method
                const textContent = $getRoot().getTextContent();
                onChange(textContent);
              });
            }}
          />
        )}
        
        {/* Additional Plugins */}
        <TabIndentationPlugin />
        <ListPlugin />
        <CheckListPlugin />
        
        {/* Floating Toolbar */}
        {floatingAnchorElem && (
          <FloatingTextFormatToolbarPlugin anchorElem={floatingAnchorElem} />
        )}
      </div>
    </div>
  );
}

/**
 * TextEditorInner
 *
 * Inner component that has access to the Lexical editor context
 */
function TextEditorInner({ 
  onChange, 
  placeholder, 
  expanded, 
  onExpandToggle,
  content 
}: { 
  onChange?: (content: string) => void; 
  placeholder?: string; 
  expanded: boolean;
  onExpandToggle: () => void;
  content?: string;
}) {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState("paragraph");

  // Mock functions for toolbar context - these would be properly implemented in a full app
  const updateToolbar = () => {
    // Update toolbar state based on current selection
  };

  const showModal = (title: string, content: (onClose: () => void) => React.ReactElement) => {
    // Show modal dialog - this would integrate with your modal system
    console.log("Show modal:", title);
    // For now, we don't use the content parameter, but it's part of the interface
    void content;
  };

  return (
    <ToolbarContext
      activeEditor={editor}
      $updateToolbar={updateToolbar}
      blockType={blockType}
      setBlockType={setBlockType}
      showModal={showModal}
    >
      <EditorPlugins 
        onChange={onChange} 
        placeholder={placeholder} 
        expanded={expanded} 
        onExpandToggle={onExpandToggle} 
        content={content}
      />
    </ToolbarContext>
  );
}

/**
 * TextEditor
 *
 * Enhanced rich text editor with comprehensive toolbar functionality
 */
function TextEditor({ initialContent, content, onChange, placeholder = "Start typing..." }: TextEditorProps = {}) {
  const [expanded, setExpanded] = useState(false);
  
  const handleExpandToggle = () => setExpanded((prev) => !prev);
  
  // Create initial editor state
  let editorInitialValue: string | undefined;
  
  if (initialContent) {
    editorInitialValue = JSON.stringify(initialContent);
  } else if (content && content.trim()) {
    // Create a simple paragraph with the text content
    const simpleState = {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: content,
                type: "text",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    };
    editorInitialValue = JSON.stringify(simpleState);
  }
  // If no content provided, let Lexical use its default empty state

  return (
    <div className="w-full overflow-hidden rounded-lg border bg-background shadow-sm">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          editorState: editorInitialValue,
        }}
      >
        <TooltipProvider>
          <TextEditorInner 
            onChange={onChange} 
            placeholder={placeholder} 
            expanded={expanded} 
            onExpandToggle={handleExpandToggle} 
            content={content}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export default TextEditor;
