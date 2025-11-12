import React from "react";
import {
  Routes,
  Route
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./App.css";
import Header from "./components/Header";
import HomeScreen from "./screens/HomeScreen";
import AboutScreen from "./screens/AboutScreen";
import AdminPanel from "./screens/AdminPanel";
import Login from "./screens/Login";
import Footer from "./components/Footer";
import ContactForm from "./screens/Contact";

// Component to conditionally show AdminPanel or redirect
function AdminRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AdminPanel /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/about" element={<AboutScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/contact" element={<ContactForm />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;