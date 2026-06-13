import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
export default function LoginPage() {
  const [username, setUsername] = useState('admin'); const [password, setPassword] = useState('sergio123');
  const [error, setError] = useState(''); const { login } = useAuth(); const navigate = useNavigate();
  const submit = async (e) => { e.preventDefault(); try { await login(username, password); navigate('/'); } catch (err) { setError(err.response?.data?.message || 'No se pudo iniciar sesión'); } };
  return <div className="login-page"><form className="login-card" onSubmit={submit}><div className="brand big">Chiki<span>Pronósticos</span></div><p>Predicciones familiares del Mundial 2026</p><label>Usuario<input value={username} onChange={e=>setUsername(e.target.value)}/></label><label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<div className="alert">{error}</div>}<button>Ingresar</button></form></div>;
}
