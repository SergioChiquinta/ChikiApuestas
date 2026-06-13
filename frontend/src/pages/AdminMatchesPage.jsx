import{useEffect,useState}from'react';
import{api}from'../api/client';

export default function AdminMatchesPage(){
    const[matches,setMatches]=useState([]);
    const load=()=>api.get('/matches').then(r=>setMatches(r.data));
    useEffect(() => {
    void load();
    }, []);
    const save=async(m,e)=>{e.preventDefault();
    const f=new FormData(e.currentTarget);
    await api.put(`/admin/matches/${m.id}`,{goles_local:Number(f.get('home')),
    goles_visitante:Number(f.get('away')),estado:f.get('estado')});
    load()};
    
    return 
    <section>
        <h1>Administrar partidos</h1>
        <div className="match-grid">{matches.map(m=>
            <form className="match-card" key={m.id} onSubmit={e=>save(m,e)}>
                <div className="match-meta">
                    <span>#{m.id} · {m.fecha}</span>
                </div>
                <h3>{m.local} vs {m.visitante}</h3>
                <div className="score-inputs">
                    <input name="home" type="number" min="0" defaultValue={m.goles_local}/>
                    <span>-</span>
                    <input name="away" type="number" min="0" defaultValue={m.goles_visitante}/>
                </div>
                <select name="estado" defaultValue={m.estado}>
                    <option value="pendiente">pendiente</option>
                    <option value="cerrado">cerrado</option>
                    <option value="finalizado">finalizado</option>
                </select>
                <button>Actualizar</button>
            </form>)}
        </div>
    </section>}
