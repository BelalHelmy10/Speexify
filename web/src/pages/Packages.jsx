import { useEffect, useState } from "react";
import axios from "axios";

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
    <div style={{ padding: 16 }}>
      <h2>Packages</h2>
      <ul>
        {packages.map((p) => (
          <li key={p.id} style={{ marginBottom: 12 }}>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <p>
              <strong>${p.priceUSD}</strong>
            </p>
            {p.features && <p>{p.features}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Packages;
