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
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Iniciar Sesión (Simulado)</h2>
        <label className="block text-sm text-gray-600">Usuario</label>
        <input value={usuario} onChange={e=>setUsuario(e.target.value)} className="input mb-3 w-full" />

        <label className="block text-sm text-gray-600">Rol</label>
        <select value={rol} onChange={e=>setRol(e.target.value)} className="input mb-4 w-full">
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
