
export default function SearchPanel() {
  return (
    <div>
      <h2 className="font-semibold mb-4">Search & Replace</h2>
      <input
        placeholder="Search..."
        className="border p-2 rounded w-full mb-2"
      />
      <input
        placeholder="Replace..."
        className="border p-2 rounded w-full"
      />
    </div>
  );
}
