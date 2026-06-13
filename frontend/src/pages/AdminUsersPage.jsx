import{useEffect,useState}from'react';
import{api}from'../api/client';

export default function AdminUsersPage(){
    const[users,setUsers]=useState([]);
    const load=()=>api.get('/admin/users').then(r=>setUsers(r.data));
    useEffect(() => {
    void load();
    }, []);
    const create=async(e)=>{e.preventDefault();
    const f=new FormData(e.currentTarget);
    await api.post('/admin/users',Object.fromEntries(f));
    e.currentTarget.reset();
    load()};
    const toggle=async u=>{await api.put(`/admin/users/${u.id}`,{activo:u.activo==='si'?'no':'si'});load()};
    
    return <section><h1>Administrar usuarios</h1><form className="panel inline-form" onSubmit={create}><input name="username" placeholder="Usuario" required/><input name="nombre" placeholder="Nombre" required/><input name="password" type="password" placeholder="Contraseña" required/><select name="rol"><option value="participante">participante</option><option value="admin">admin</option></select><input name="puntos_iniciales" type="number" defaultValue="0"/><button>Agregar</button></form><div className="panel table-wrap"><table><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Puntos</th><th>Estado</th><th></th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.username}</td><td>{u.nombre}</td><td>{u.rol}</td><td>{Number(u.puntos_iniciales||0)+Number(u.puntos_ganados||0)}</td><td>{u.activo}</td><td><button className="small" onClick={()=>toggle(u)}>{u.activo==='si'?'Desactivar':'Activar'}</button></td></tr>)}</tbody></table></div></section>}
