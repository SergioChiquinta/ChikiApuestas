import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
export default function DashboardPage(){
 const {user}=useAuth(); const [matches,setMatches]=useState([]); const [ranking,setRanking]=useState([]);
 useEffect(()=>{Promise.all([api.get('/matches'),api.get('/matches/ranking')]).then(([m,r])=>{setMatches(m.data);setRanking(r.data)})},[]);
 const pending=matches.filter(m=>m.estado==='pendiente').length; const finished=matches.filter(m=>m.estado==='finalizado').length;
 return <section><h1>Panel principal</h1><div className="stats"><article><span>Partidos pendientes</span><strong>{pending}</strong></article><article><span>Finalizados</span><strong>{finished}</strong></article><article><span>Tus puntos</span><strong>{Number(user?.puntos_iniciales||0)+Number(user?.puntos_ganados||0)}</strong></article></div><div className="panel"><h2>Primeros del ranking</h2>{ranking.slice(0,5).map((r,i)=><div className="rank-row" key={r.id}><b>#{i+1}</b><span>{r.nombre}</span><strong>{r.puntos_totales} pts</strong></div>)}</div></section>
}
