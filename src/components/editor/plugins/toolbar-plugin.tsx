/* ==========================================================================*/
// toolbar-plugin.tsx — Main toolbar plugin wrapper component
/* ==========================================================================*/
// Purpose: Provides a toolbar context and wrapper for editor formatting controls
// Sections: Imports, Types, Hook, Component, Exports

"use client";

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import { ReactNode } from "react";

// Lexical core ---
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { $getSelectionStyleValueForProperty } from "@lexical/selection";
import { $isHeadingNode } from "@lexical/rich-text";
import { mergeRegister } from "@lexical/utils";
import { useCallback, useEffect, useState } from "react";

/* ==========================================================================*/
// Types and Interfaces
/* ==========================================================================*/

interface ToolbarPluginProps {
  children: (props: ToolbarState) => ReactNode;
}

interface ToolbarState {
  blockType: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  fontSize: string;
  fontColor: string;
  bgColor: string;
  fontFamily: string;
}

/* ==========================================================================*/
// Custom Hook
/* ==========================================================================*/

/**
 * useToolbarState
 *
 * Custom hook that tracks the current state of toolbar formatting options
 */
function useToolbarState(): ToolbarState {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [fontSize, setFontSize] = useState("15px");
  const [fontColor, setFontColor] = useState("#000");
  const [bgColor, setBgColor] = useState("#fff");
  const [fontFamily, setFontFamily] = useState("Arial");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      // Update block type
      if (elementDOM !== null) {
        if ($isHeadingNode(element)) {
          const tag = element.getTag();
          setBlockType(tag);
        } else {
          setBlockType(element.getType() || "paragraph");
        }
      }

      // Update formatting states
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

      // Update font properties
      setFontSize(
        $getSelectionStyleValueForProperty(selection, "font-size", "15px")
      );
      setFontColor(
        $getSelectionStyleValueForProperty(selection, "color", "#000")
      );
      setBgColor(
        $getSelectionStyleValueForProperty(selection, "background-color", "#fff")
      );
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, "font-family", "Arial")
      );
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      })
    );
  }, [editor, updateToolbar]);

  return {
    blockType,
    isBold,
    isItalic,
    isUnderline,
    isStrikethrough,
    fontSize,
    fontColor,
    bgColor,
    fontFamily,
  };
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * ToolbarPlugin
 *
 * Main toolbar plugin that provides formatting state and context to child components
 */
function ToolbarPlugin({ children }: ToolbarPluginProps) {
  const toolbarState = useToolbarState();

  return <>{children(toolbarState)}</>;
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export { ToolbarPlugin };
export type { ToolbarState }; 