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
import { useState } from "react";

// Lexical core ---
import { SerializedEditorState } from "lexical";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
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

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface TextEditorProps {
  initialContent?: SerializedEditorState;
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
// Components
/* ==========================================================================*/

/**
 * ToolbarPlugins
 *
 * Component that renders the fixed toolbar with all formatting options
 */
function ToolbarPlugins() {
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
    </div>
  );
}

/**
 * EditorPlugins
 *
 * Component that manages all editor plugins including floating toolbar
 */
function EditorPlugins() {
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <div className="relative">
      {/* Fixed Toolbar */}
      <ToolbarPlugins />

      {/* Editor Content */}
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div className="relative">
              <div ref={onRef}>
                <ContentEditable
                  placeholder="Start typing..."
                  className="ContentEditable__root relative block min-h-[300px] overflow-auto px-6 py-4 focus:outline-none"
                />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        
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
function TextEditorInner() {
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
      <EditorPlugins />
    </ToolbarContext>
  );
}

/**
 * TextEditor
 *
 * Enhanced rich text editor with comprehensive toolbar functionality
 */
function TextEditor({ initialContent }: TextEditorProps = {}) {
  // Use provided initial content or fall back to default
  const editorInitialValue = initialContent || {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: "Start typing with rich formatting...",
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
  } as unknown as SerializedEditorState;

  return (
    <div className="w-full overflow-hidden rounded-lg border bg-background shadow-sm">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          editorState: JSON.stringify(editorInitialValue),
        }}
      >
        <TooltipProvider>
          <TextEditorInner />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export default TextEditor;
