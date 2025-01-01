// Templates.jsx
function Templates() {
    const templateData = [
      { name: "Research Paper", desc: "A clean template for research papers.", link: "/templates/research-paper" },
      { name: "Project Report", desc: "A versatile project report template.", link: "/templates/project-report" },
      { name: "Proposal", desc: "A structured template for project proposals.", link: "/templates/proposal" },
      { name: "Thesis", desc: "A comprehensive academic thesis template.", link: "/templates/thesis" },
      { name: "Conference Paper", desc: "A template for conference papers.", link: "/templates/conference-paper" },
      { name: "Resume", desc: "A clean and professional resume template.", link: "/templates/resume" }
    ];
  
    return (
      <section className="py-12 px-6 bg-gray-50">
        <h2 className="text-3xl font-semibold text-center mb-8">LaTeX Templates</h2>
        <p className="text-center text-lg mb-8 text-gray-600">Browse through various LaTeX templates for reports, proposals, resumes, and more.</p>
  
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {templateData.map((template, index) => (
            <div key={index} className="flex flex-col items-center bg-white shadow-lg rounded-lg p-6">
              <img src="https://via.placeholder.com/150" alt={template.name} className="w-full h-40 object-cover rounded-md mb-4" />
              <h3 className="text-xl font-semibold mb-2">{template.name} Template</h3>
              <p className="text-gray-700 mb-4">{template.desc}</p>
              <a href={template.link} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">Preview</a>
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  export default Templates;
  