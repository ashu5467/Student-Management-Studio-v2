import React from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink, useLocation } from 'react-router-dom';
import TeacherDataComponent from './TeacherDataComponent';
import StudentDataComponent from './StudentDataComponent';
import GroupPhotoGeneration from './GroupPhotoGeneration';
import Magazine from './Magazine';
import picvinew from './picvinew.jpg';  // Import the image

function HomePage() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Side Navigation */}
      <aside className="w-64 bg-teal-600 text-white p-6 flex flex-col space-y-6">
        <div className="text-2xl font-bold">School Management</div>
        <nav className="flex flex-col space-y-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-lg font-medium hover:bg-teal-700 p-3 rounded ${
                isActive ? 'bg-teal-700' : ''
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/student"
            className={({ isActive }) =>
              `text-lg font-medium hover:bg-teal-700 p-3 rounded ${
                isActive ? 'bg-teal-700' : ''
              }`
            }
          >
            Student
          </NavLink>
          <NavLink
            to="/teacher"
            className={({ isActive }) =>
              `text-lg font-medium hover:bg-teal-700 p-3 rounded ${
                isActive ? 'bg-teal-700' : ''
              }`
            }
          >
            Teacher
          </NavLink>
          <NavLink
            to="/group-photo"
            className={({ isActive }) =>
              `text-lg font-medium hover:bg-teal-700 p-3 rounded ${
                isActive ? 'bg-teal-700' : ''
              }`
            }
          >
            Group Photo
          </NavLink>
          <NavLink
            to="/create-magazine"
            className={({ isActive }) =>
              `text-lg font-medium hover:bg-teal-700 p-3 rounded ${
                isActive ? 'bg-teal-700' : ''
              }`
            }
          >
            Create Magazine
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Conditionally render the image only on the home page */}
        {location.pathname === '/' && (
          <div className="flex flex-col items-center justify-center mb-8">
            {/* Image */}
            <img 
              src={picvinew} 
              alt="School Management" 
              className="w-full max-w-4xl h-auto object-cover mb-4" 
            />
            {/* Text below the image */}
            <div className="text-center p-4 bg-black bg-opacity-50 text-white p-4 w-full text-center">
              <h2 className="text-xl font-bold">Picvi Photography</h2>
              <p>#011, SM Zinnia, Balagere,</p>
              <p>Varthur, Bangalore -560087</p>
              <p>Ph: 9845041262</p>
              <p>e-mail: picviphotography@gmail.com</p>
            </div>
          </div>
        )}
        
        <Routes>
          <Route path="/" element={null} />
          <Route path="/student" element={<StudentDataComponent />} />
          <Route path="/teacher" element={<TeacherDataComponent />} />
          <Route path="/group-photo" element={<GroupPhotoGeneration />} />
          <Route path="/create-magazine" element={<Magazine />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <HomePage />
    </Router>
  );
}
