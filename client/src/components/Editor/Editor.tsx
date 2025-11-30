import CodeMirror from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import { scrollPastEnd, EditorView } from "@codemirror/view";
//import { vim } from "@replit/codemirror-vim" --> new feature

interface EditorProps {
  value: string;
  onChange: (code: string) => void;
}

//Setting up editor theme
const EditorTheme = EditorView.theme({
	".cm-content": {
		fontSize: "16px",
    fontWeight: "bold",
	},
});



export default function Editor({ value, onChange }: EditorProps) {
  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <CodeMirror
        value={value}
        height="100%"
        theme="light"
        extensions={[
          latex(),
  				EditorView.lineWrapping,
					EditorTheme,
          scrollPastEnd(),
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
