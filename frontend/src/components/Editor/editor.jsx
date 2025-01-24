import React, { Children } from "react";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

const Layout = ({ Children }) => {
    return (
        <div className="layout">
            <Navbar />
            <main className="main-content">{Children}</main>
            <Footer />
        </div>
    );
};

export default Layout;