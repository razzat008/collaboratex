import React from "react";
import Navbar from "./components/Navbar/Navbar";

function App() {
  return (
    <div className="App">
      <Navbar />
      <main className="container mx-auto mt-8 p-4">
        <h1 className="text-3xl font-bold mb-4">Welcome to Collaboratex</h1>
        <p className="text-gray-600">This is a the sample homepage.</p>
      </main>
    </div>
  )
}

export default App


