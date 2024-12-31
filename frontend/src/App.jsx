import React from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Main from "./components/Main/Main";

function App() {
  return (
    <div className="App flex flex-col min-h-screen">
      <Navbar />
      <Main />
      <Footer />
    </div>
  )
}

export default App


