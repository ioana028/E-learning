
import React, { useState } from "react";
import "./DictionaryOverlay.css";

const DictionaryOverlay = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDefine = async () => {
    if (!query.trim()) return;
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${query}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        const entry = data[0];
        const definition = entry.meanings?.[0]?.definitions?.[0]?.definition;
        const example = entry.meanings?.[0]?.definitions?.[0]?.example;
        const partOfSpeech = entry.meanings?.[0]?.partOfSpeech;
        const phonetic = entry.phonetics?.[0]?.text;

        setResult({ definition, example, partOfSpeech, phonetic });
      } else {
        setError("❌ Cuvăntul nu a fost găsit.");
      }
    } catch (err) {
      console.error("Eroare definire:", err);
      setError("❌ Nu s-a putut obține definiția.");
    }
  };

  return (
    <div className="dictionary-overlay-container">
      <div className="dictionary-overlay-header">
        <h4>📘 Dicționar Englez</h4>
        <button onClick={onClose}>✖</button>
      </div>

      <div className="dictionary-overlay-controls">
        <input
          type="text"
          placeholder="Cuvânt (ex: example)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleDefine}>🔍 Caută definiția</button>
      </div>

      {error && <p className="dictionary-overlay-error">{error}</p>}

      {result && (
        <div className="dictionary-overlay-result">
          <p><strong>Definiție:</strong> {result.definition}</p>
          {result.example && <p><strong>Exemplu:</strong> {result.example}</p>}
          {result.partOfSpeech && <p><strong>Tip:</strong> {result.partOfSpeech}</p>}
          {result.phonetic && <p><strong>Pronunție:</strong> {result.phonetic}</p>}
        </div>
      )}
    </div>
  );
};

export default DictionaryOverlay;
