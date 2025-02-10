import React from 'react';

function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <h2 className="text-5xl font-bold text-gray-800">404 - Page Not Found</h2>
                <p className="mt-6 text-gray-600 text-lg">Oops! The page you are looking for does not exist.</p>
            </div>
        </div>
    );
}

export default NotFound;
