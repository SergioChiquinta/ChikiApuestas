import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function RankingPage() {
  const [r, setR] = useState([]);

  useEffect(() => {
    api.get('/matches/ranking').then(x => setR(x.data));
  }, []);

  return (
    <section>
      <h1>Ranking familiar</h1>
      <div className="panel">
        {r.map((u, i) => (
          <div className="rank-row" key={u.id}>
            <b>#{i + 1}</b>
            <span>{u.nombre}</span>
            <strong>{u.puntos_totales} pts</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
