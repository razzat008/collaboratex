import React from "react";
import "../../styles/global.css";

const TopBar: React.FC = () => {
  return (
    <div className="top-bar">
      <div className="top-bar__project-name">
        <span>My LaTeX Project</span>
      </div>
      <div className="top-bar__actions">
        <button className="top-bar__compile-btn">Compile</button>
      </div>
      <div className="top-bar__user">
        <span>User</span>
      </div>
    </div>
  );
};

export default TopBar;
