import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Packages.scss";

function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://localhost:5050/api/packages");
        setPackages(res.data);
      } catch (e) {
        console.error(e);
        setError("Could not load packages");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p>Loading packages…</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2 style={{ textAlign: "center", margin: "20px 0" }}>Our Packages</h2>
      <div className="packages-container">
        {packages.map((p) => (
          <div key={p.id} className="package-card">
            <div className="package-title">{p.title}</div>
            <div className="package-description">{p.description}</div>
            <div className="package-price">${p.priceUSD}</div>
            {p.features && <div>{p.features}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Packages;
