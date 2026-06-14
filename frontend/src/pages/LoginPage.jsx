import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      showToast('Bienvenido a las encuestas familiares.', 'success');
      navigate('/');
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'No se pudo iniciar sesión.');
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand big">Chiki<span>Pronósticos</span></div>
        <p>Elige a quién apoyas en cada partido y compara la participación familiar.</p>

        <label>
          Usuario
          <input 
            value={username} 
            onChange={(event) => setUsername(event.target.value)} 
            placeholder="Usuario" 
            required 
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña"
            required
          />
        </label>

        {error && <div className="alert">{error}</div>}
        <button disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </div>
  );
}
