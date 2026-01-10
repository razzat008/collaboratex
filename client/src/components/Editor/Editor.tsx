import CodeMirror from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import { highlightActiveLine, EditorView } from "@codemirror/view";
import { useCollaboration } from "./collaboration.tsx";
import { yCollab } from "y-codemirror.next";

interface EditorProps {
  value: string;
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

export default function Editor({ value }: EditorProps) {
	/* Todo: develop an api to get roomname also do something for websocket */
	const { ydoc, provider } = useCollaboration("", 'ws://localhost:8080')
	const ytext = ydoc.getText("codemirror");
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
          yCollab(ytext, provider.awareness), 
          customScrollPad,

          EditorView.theme({
            ".cm-scroller": { overflow: "auto" },
          }),
        ]}
        basicSetup={{
          lineNumbers: true,
          autocompletion: true,
        }}
      />
    </div>
  );
}
