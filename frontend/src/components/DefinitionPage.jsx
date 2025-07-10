import React, { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import "./DefinitionPage.css";

const DefinitionPage = () => {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setError("");
    setData(null);
    if (!query.trim()) return;

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${query}`);
      const json = await res.json();

      if (Array.isArray(json)) {
        setData(json[0]);
      } else {
        setError("❌ Cuvântul nu a fost găsit.");
      }
    } catch (err) {
      setError("❌ Eroare la căutare.");
    }
  };

  return (
    <DashboardLayout>
      <div className="definition-page">
        <h2>📘 Dicționar complet</h2>
        <div className="definition-search">
          <input
            type="text"
            placeholder="Introduceți un cuvânt..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={handleSearch}>🔍 Caută</button>
        </div>

        {error && <p className="definition-error">{error}</p>}

        {data && (
          <div className="definition-result">
            <h3>{data.word}</h3>

            {data.phonetics?.[0]?.text && <p><strong>Pronunție:</strong> {data.phonetics[0].text}</p>}
            {data.phonetics?.[0]?.audio && (
              <audio controls>
                <source src={data.phonetics[0].audio} type="audio/mpeg" />
                Your browser does not support the audio tag.
              </audio>
            )}

            {data.meanings.map((meaning, idx) => (
              <div key={idx} className="definition-block">
                <h4>📘 {meaning.partOfSpeech}</h4>

                {meaning.definitions.map((def, i) => (
                  <div key={i} className="definition-entry">
                    <p><strong>Definiție:</strong> {def.definition}</p>
                    {def.example && <p><strong>Exemplu:</strong> <em>{def.example}</em></p>}
                    {def.synonyms?.length > 0 && (
                      <p><strong>Sinonime:</strong> {def.synonyms.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DefinitionPage;
