import React from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <div className="App flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto mt-8 p-4">
        <h1 className="text-6xl text-center font-bold mb-4">\begin{"{latex}"}</h1>
        <p className="text-2xl text-center text-gray-600">Welcome to Collaboratex.</p>
      </main>
      <Footer />
    </div>
  )
}

export default App


