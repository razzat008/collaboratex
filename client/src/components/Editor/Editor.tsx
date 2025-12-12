import CodeMirror from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import { highlightActiveLine, EditorView } from "@codemirror/view";

interface EditorProps {
  value: string;
  onChange: (code: string) => void;
}

const keepCursorVisible = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    update.view.scrollIntoView(update.state.selection.main.head, {
      y: "nearest",
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
    <div className="h-[95%] overflow-auto">
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

          EditorView.theme({
            ".cm-scroller": { overflow: "auto" },
          }),
        ]}
        onChange={(value) => onChange(value)}
        basicSetup={{
          lineNumbers: true,
          autocompletion: true,
        }}
      />
    </div>
  );
}
