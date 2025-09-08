import { useEffect, useState } from "react";
import axios from "axios";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [backendMessage, setBackendMessage] = useState("");

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await axios.get("http://localhost:5050/api/message");
        setBackendMessage(res.data.message); // Axios already gives JSON
      } catch (error) {
        console.error("Error fetching message:", error);
      }
    };

    fetchMessage();
  }, []);

  return (
    <div className="App">
      <h1>Hello Speexify</h1>
      <p>{backendMessage}</p>
    </div>
  );
}

export default App;
