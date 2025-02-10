function Main() {
  return (
    <main className="flex-grow container mx-auto mt-12 p-8">

      <section className="text-center mb-20 px-4">
        <h1 className="text-6xl font-extrabold text-blue-950 mb-8">
          \begin{"{latex}"}
        </h1>
        <p className="text-3xl font-medium text-gray-800 mb-4 max-w-4xl mx-auto">
          Welcome to <span className="font-bold">Collaboratex</span> – the future of <br/>scientific and technical writing.
        </p>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          LaTeX is more than just a typesetting system. It is the backbone of scientific and academic documentation, enabling researchers and professionals to create complex documents with ease. <strong>Collaboratex</strong> brings LaTeX to life in a modern, collaborative environment.
        </p>
      </section>

      <section className="py-16 bg-gray-50 shadow-xl rounded-lg mb-16">
        <h3 className="text-3xl font-semibold text-center text-blue-950 mb-6">
          Empowering Collaboration, Anywhere
        </h3>
        <p className="text-xl text-center text-gray-600 mb-8 max-w-5xl mx-auto leading-relaxed">
          One of the key advantages of Collaboratex is its real-time collaboration capabilities. You can work with your peers, colleagues, or research partners, regardless of location. Share your work, receive feedback, and make edits simultaneously, all while maintaining version control. This not only saves time but also brings a new level of flexibility to your workflow.
        </p>
        <p className="text-xl text-center text-gray-600 max-w-5xl mx-auto">
          Collaboratex ensures that everyone on your team is always on the same page. From writing to editing to finalizing your documents, everything is simple and efficient.
        </p>
      </section>

      {/* Future of Scientific Writing Section */}
      <section className="py-16 bg-gradient-to-l from-gray-50 to-blue-50 rounded-xl shadow-xl mb-16">
        <h3 className="text-3xl font-semibold text-center text-blue-950 mb-6">
          LaTeX: The Future of Scientific Writing
        </h3>
        <p className="text-xl text-center text-gray-700 mb-8 max-w-5xl mx-auto leading-relaxed">
          LaTeX is trusted by professionals worldwide for its unmatched precision and output quality. As more research, academic papers, and scientific publications move towards digital collaboration, LaTeX remains the preferred tool for its flexibility, ease of use, and attention to detail.
        </p>
        <p className="text-xl text-center text-gray-600 max-w-5xl mx-auto mb-6">
          Collaboratex extends LaTeX's capabilities by integrating powerful collaboration tools. Whether you're a seasoned LaTeX user or new to the system, Collaboratex's intuitive interface simplifies the process of writing, sharing, and editing your documents.
        </p>
      </section>

      {/* Call to Action Section */}
      <section className="text-center py-16 bg-gradient-to-t from-blue-400 to-blue-300 rounded-lg shadow-xl">
        <h3 className="text-4xl font-semibold text-center text-white mb-6">
          Ready to Start Your Writing Journey?
        </h3>
        <p className="text-2xl text-center text-white mb-14 max-w-4xl mx-auto leading-relaxed">
          Dive into the world of LaTeX with Collaboratex today. Experience the power of professional document creation and real-time collaboration. Whether you're drafting a research paper or collaborating on a project, Collaboratex will streamline your workflow and make the process smooth and efficient.
        </p>
        <div className="flex justify-center space-x-8">
          <button className="bg-blue-600 text-white py-3 px-8 rounded-lg text-xl shadow-lg transform transition duration-300 hover:bg-blue-700 hover:scale-105 focus:outline-none">
            Start Writing Now
          </button>
          <button className="bg-transparent bg-blue-950 text-white border-2 border-blue-950 py-3 px-8 rounded-lg text-xl shadow-lg transform transition duration-300 hover:bg-blue-950 hover:text-white hover:scale-105 focus:outline-none">
            Explore Features
          </button>
        </div>
      </section>
    </main>
  );
}

export default Main;
