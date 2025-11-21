import { useState, useEffect } from 'react';

function useTheme() {
  // 1. Leemos el tema guardado o usamos 'light' por defecto
  const savedTheme = localStorage.getItem('theme') || 'light';
  const [theme, setTheme] = useState(savedTheme);

  useEffect(() => {
    const root = document.documentElement;
    
    // 2. Limpiamos cualquier clase anterior
    root.className = ''; 
    
    // 3. Aplicamos la clase según el estado
    if (theme === 'dark') {
      root.classList.add('dark-mode');
    } else if (theme === 'high-contrast') {
      root.classList.add('high-contrast-mode');
    }
    
    // 4. Guardamos la preferencia en el navegador
    localStorage.setItem('theme', theme);
  }, [theme]);

  return [theme, setTheme];
}

export default useTheme;