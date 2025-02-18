import { useState, useEffect } from "react";

const PDFViewer = ({ filePath }) => {
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(filePath, { method: "HEAD" })
      .then((res) => {
        if (!res.ok || res.headers.get("Content-Type") !== "application/pdf") {
          throw new Error("Invalid PDF file");
        }
        setIsError(false);
      })
      .catch(() => setIsError(true))
      .finally(() => setLoading(false));
  }, [filePath]);

  if (loading) {
    return <div className="text-center p-4">Loading PDF...</div>;
  }

  return (
    <div className="pdf-container w-full h-[600px]">
      {isError ? (
        <div className="error-message flex justify-center items-center h-full">
          <p className="text-red-500 text-lg">Error: PDF file not found or inaccessible.</p>
        </div>
      ) : (
        <object data={filePath} type="application/pdf" width="100%" height="1000px">
          <p className="text-red-500">
            Your browser does not support PDFs.{" "}
            <a href={filePath} className="text-blue-500">
              Download PDF
            </a>{" "}
            instead.
          </p>
        </object>
      )}
    </div>
  );
};

export default PDFViewer;
