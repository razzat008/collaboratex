import EditorPane from "../Editor/Editor";
import PreviewPane from "../Preview/PreviewPane";

export default function SplitView() {
  return (
    <div className="flex flex-1">
      <EditorPane />
      <PreviewPane />
    </div>
  );
}
