// src/components/Main.jsx
import React from 'react';
import Table from './dashboard';  // Import Table component

const Main = () => {
  return (
    <div>
      <h1 className="text-center text-xl font-semibold mb-4">Projects Table</h1>
      <h2> connect to the database, just the demo data </h2>
      <Table />  {/* Render the Table component */}
    </div>
  );
};

export default Main;