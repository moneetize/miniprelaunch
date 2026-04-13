import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { initializeQuests } from './utils/questManager';

export default function App() {
  useEffect(() => {
    initializeQuests();
  }, []);

  return <RouterProvider router={router} />;
}
