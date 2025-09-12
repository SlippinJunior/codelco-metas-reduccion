import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [usuario, setUsuario] = useState('admin');
  const [rol, setRol] = useState('control-interno');
  const nav = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    localStorage.setItem('currentUser', JSON.stringify({ usuario, rol }));
    nav('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-codelco-light">
      <form onSubmit={submit} className="card w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Iniciar Sesión (Simulado)</h2>
        <label className="form-label">Usuario</label>
        <input value={usuario} onChange={e=>setUsuario(e.target.value)} className="input mb-3" />

        <label className="form-label">Rol</label>
        <select value={rol} onChange={e=>setRol(e.target.value)} className="input mb-4">
          <option value="control-interno">control-interno</option>
          <option value="auditor">auditor</option>
          <option value="jefe-operaciones">jefe-operaciones</option>
          <option value="operario">operario</option>
        </select>

        <div className="flex justify-end">
          <button className="btn-primary" type="submit">Entrar</button>
        </div>
      </form>
    </div>
  );
}

export default Login;
