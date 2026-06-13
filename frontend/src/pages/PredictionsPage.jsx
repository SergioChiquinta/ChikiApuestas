import { useEffect,useMemo,useState } from 'react'; 
import { api } from '../api/client';

export default function PredictionsPage(){
    const [matches,setMatches]=useState([]);
    const [picks,setPicks]=useState([]);
    useEffect(()=>{Promise.all([api.get('/matches'),api.get('/predictions/me')]).then(([m,p])=>{setMatches(m.data);
        setPicks(p.data)})},[]);
        const map=useMemo(()=>Object.fromEntries(picks.map(p=>[String(p.partido_id),p])),[picks]);
        const save=async(m,e)=>{e.preventDefault();
        const fd=new FormData(e.currentTarget);
        const {data}=await api.put(`/predictions/${m.id}`,{goles_local:Number(fd.get('home')),goles_visitante:Number(fd.get('away'))});
        setPicks(old=>[...old.filter(p=>String(p.partido_id)!==String(m.id)),data])};
        
        return <section><h1>Mis pronósticos</h1><div className="match-grid">{matches.filter(m=>m.estado==='pendiente').map(m=>{const p=map[String(m.id)]||{};return <form className="match-card" key={m.id} onSubmit={e=>save(m,e)}><div className="match-meta"><span>#{m.id} · {m.fecha}</span><span className="status pendiente">abierto</span></div><h3>{m.local} vs {m.visitante}</h3><div className="score-inputs"><input name="home" type="number" min="0" max="20" defaultValue={p.goles_local??0}/><span>-</span><input name="away" type="number" min="0" max="20" defaultValue={p.goles_visitante??0}/></div><button>Guardar pronóstico</button></form>})}</div></section>}
