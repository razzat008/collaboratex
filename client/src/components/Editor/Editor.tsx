import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import {
  highlightActiveLine,
  EditorView,
} from "@codemirror/view";
import { ScrollArea } from "../ui/scroll-area";

interface EditorProps {
  value: string;
  onChange: (code: string) => void;
}

const keepCursorVisible = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    const head = update.state.selection.main.head;
    update.view.scrollIntoView(head, {
      y: "nearest", // ensures cursor is visible vertically
      x: "nearest",
    });
  }
});
// Reduce scrollPastEnd extra padding
const customScrollPad = EditorView.theme({
  ".cm-scroller": {
    paddingBottom: "45rem", // smaller scroll area after last line
  },
});

export default function Editor({ value, onChange }: EditorProps) {
  return (
    <ScrollArea className="h-full overflow-clip">
      <CodeMirror
        value={value}
        height="100%"
        theme="light"
        extensions={[
          latex(),
          keepCursorVisible,
          highlightActiveLine(),
          EditorView.lineWrapping,
          customScrollPad,
        ]}
        onChange={(value) => onChange(value)}
        basicSetup={{
          lineNumbers: true,
          autocompletion: true,
        }}
      />
    </ScrollArea>
  );
}
