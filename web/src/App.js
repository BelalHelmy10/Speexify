import { useEffect, useState } from "react";
import axios from "axios";
import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Packages from "./pages/Packages";
import IndividualTraining from "./pages/IndividualTraining";
import CorporateTraining from "./pages/CorporateTraining";
import Contact from "./pages/Contact";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: "flex", gap: 16, padding: 16 }}>
        <Link to="/">Home</Link>
        <Link to="/individual-training">Individual</Link>
        <Link to="/corporate-training">Corporate</Link>
        <Link to="/packages">Packages</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/register">Register</Link>
        <Link to="/login">Login</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/calendar">Calendar</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/individual-training" element={<IndividualTraining />} />
        <Route path="/corporate-training" element={<CorporateTraining />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
