// Features.jsx
function Features() {
    return (
      <section className="py-12 px-6 h-full bg-gray-100">
        <h2 className="text-3xl font-semibold text-center mb-8">Features of Collaboratex</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">Collaborative Editing</h3>
            <p className="text-gray-700">
              Collaboratex allows multiple users to work on a LaTeX document simultaneously. Real-time collaboration ensures smooth team workflows for academic papers, reports, and proposals.
            </p>
          </div>
  
          {/* Feature 2 */}
          <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">KU Domain Access</h3>
            <p className="text-gray-700">
              The platform is designed exclusively for Kathmandu University students and faculty. Access is granted via KU domain emails, ensuring a secure and institution-specific environment.
            </p>
          </div>
  
          {/* Feature 3 */}
          <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">Template Library</h3>
            <p className="text-gray-700">
              A vast collection of LaTeX templates is available, including templates for project reports, research papers, and proposals, making it easier for users to start their documents.
            </p>
          </div>
  
          {/* Feature 4 */}
          <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">Intuitive LaTeX Editing</h3>
            <p className="text-gray-700">
              Collaboratex simplifies the LaTeX writing experience with a user-friendly editor, supporting syntax highlighting, auto-completion, and error suggestions to make writing easier.
            </p>
          </div>
  
          {/* Feature 5 */}
          <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">Version Control</h3>
            <p className="text-gray-700">
              Keep track of your changes with version control, allowing users to revert to previous versions, compare edits, and collaborate efficiently without losing important progress.
            </p>
          </div>
  
          {/* Feature 6 */}
          <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">Integration with GitHub</h3>
            <p className="text-gray-700">
              Collaboratex integrates with GitHub, allowing users to sync their LaTeX projects with their GitHub repositories, providing additional backup and easy project management.
            </p>
          </div>
        </div>
      </section>
    );
  }
  
  export default Features;
  