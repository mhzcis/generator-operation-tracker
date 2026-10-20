import { useMemo, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppProvider } from './context/AppContext';
import { makeTheme } from './theme';
import AppShell from './components/AppShell';
import { ErrorBoundary, Notices } from './components/Common';
import Dashboard from './pages/Dashboard';
import Generators from './pages/Generators';
import OperationLogs from './pages/OperationLogs';
import NotFound from './pages/NotFound';

export default function App() {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const theme = useMemo(() => makeTheme(mode), [mode]);

  const change = x => {
    setMode(x);
    try {
      localStorage.setItem('theme', x);
    } catch {}
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AppProvider>
          <HashRouter>
            <Routes>
              <Route element={<AppShell mode={mode} setMode={change} />}>
                <Route index element={<Dashboard />} />
                <Route path="generators" element={<Generators />} />
                <Route path="logs" element={<OperationLogs />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </HashRouter>
          <Notices />
        </AppProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
