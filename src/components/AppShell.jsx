import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CloudDownloadRounded,
  DarkModeRounded,
  DashboardRounded,
  DeleteForeverRounded,
  ElectricalServicesRounded,
  LightModeRounded,
  LinkOffRounded,
  LinkRounded,
  ListAltRounded,
  MenuRounded,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { WipeDialog } from './Common';

const width = 260;
const links = [
  ['/', 'لوحة التحكم', <DashboardRounded />],
  ['/generators', 'المولدات', <ElectricalServicesRounded />],
  ['/logs', 'سجل التشغيل', <ListAltRounded />],
];

export default function AppShell({ mode, setMode }) {
  const mobile = useMediaQuery('(max-width:900px)');
  const [open, setOpen] = useState(false);
  const [wipe, setWipe] = useState(false);
  const { manualBackup, fileLinkSupported, linkedFile, linkBackup, unlinkBackup } = useApp();

  const menu = (
    <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
          ⚡ متابعة المولدات
        </Typography>
      </Box>

      <List sx={{ mt: 2 }}>
        {links.map(([to, t, i]) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            sx={{
              mb: 1,
              borderRadius: 3,
              transition: 'all 0.2s ease',
              '&.active': {
                bgcolor: 'primary.main',
                color: '#fff',
                boxShadow: '0 6px 16px rgba(15, 118, 110, 0.28)',
                '& .MuiListItemIcon-root': { color: '#fff' },
              },
            }}
          >
            <ListItemIcon>{i}</ListItemIcon>
            <ListItemText primary={t} />
          </ListItemButton>
        ))}
      </List>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<CloudDownloadRounded />}
        onClick={manualBackup}
        sx={{ mt: 1 }}
      >
        نسخة احتياطية
      </Button>
      <Button
        fullWidth
        color="error"
        variant="outlined"
        startIcon={<DeleteForeverRounded />}
        onClick={() => {
          setOpen(false);
          setWipe(true);
        }}
        sx={{ mt: 1 }}
      >
        مسح شامل
      </Button>

      {/* ربط ملف نسخة احتياطية يُحدَّث تلقائيًا (File System Access API)؛ يوقف التنزيلات التلقائية أثناء الربط */}
      <Box sx={{ mt: 1.5, textAlign: 'right' }}>
        {!fileLinkSupported ? (
          <Typography variant="body2" component="div" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
            ربط ملف نسخة احتياطية يُحدَّث تلقائيًا غير مدعوم في هذا المتصفح (متاح في Chrome وEdge على الحاسوب). تستمر النسخ الاحتياطية بالتنزيل تلقائيًا.
          </Typography>
        ) : linkedFile ? (
          <>
            <Typography variant="body2" component="div" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
              الملف المرتبط: <b>{linkedFile}</b> — يُحدَّث تلقائيًا بعد كل تعديل خلال هذه الجلسة بدل تنزيل ملفات منفصلة.
            </Typography>
            <Button fullWidth size="small" startIcon={<LinkOffRounded />} onClick={unlinkBackup} sx={{ mt: 0.5 }}>
              إلغاء ربط الملف
            </Button>
          </>
        ) : (
          <Button fullWidth size="small" startIcon={<LinkRounded />} onClick={linkBackup}>
            ربط ملف نسخة احتياطية
          </Button>
        )}
      </Box>

      <Box
        sx={{
          mt: 'auto',
          pt: 3,
          textAlign: 'right',
          color: 'text.secondary',
        }}
      >
        <Box
          sx={{
            p: 1.75,
            textAlign: 'center',
            borderRadius: 3.5,
            background: theme =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.14) 0%, rgba(15, 28, 44, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(15, 118, 110, 0.09) 0%, rgba(245, 158, 11, 0.07) 100%)',
            border: '1px solid',
            borderColor: theme =>
              theme.palette.mode === 'dark'
                ? 'rgba(20, 184, 166, 0.28)'
                : 'rgba(15, 118, 110, 0.18)',
            boxShadow: theme =>
              theme.palette.mode === 'dark'
                ? '0 8px 20px rgba(0, 0, 0, 0.3)'
                : '0 8px 20px rgba(15, 118, 110, 0.06)',
          }}
        >
          <Typography variant="caption" component="div" sx={{ opacity: 0.85, fontWeight: 600 }}>
            برمجة وتطوير:
          </Typography>
          <Typography
            variant="caption"
            component="div"
            fontWeight={800}
            sx={{ color: 'text.primary', fontSize: '0.9rem', mt: 0.25 }}
          >
            م. محمد أبو زهري
          </Typography>
          <Box
            sx={{
              mt: 1,
              pt: 0.75,
              borderTop: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6em',
              fontSize: '0.74rem',
              fontWeight: 600,
            }}
          >
            <span>صُنع بكل حب</span>
            <Box component="span" sx={{ color: '#e11d48', fontSize: '0.95rem', lineHeight: 1 }}>
              ♥️
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          mr: mobile ? 0 : `${width}px`,
          width: mobile ? '100%' : `calc(100% - ${width}px)`,
          backdropFilter: 'blur(16px)',
          bgcolor: theme => alpha(theme.palette.background.paper, 0.82),
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {mobile && (
            <IconButton onClick={() => setOpen(true)}>
              <MenuRounded />
            </IconButton>
          )}
          <Typography sx={{ flexGrow: 1, fontWeight: 800 }}>
            نظام متابعة تشغيل المولدات
          </Typography>
          <IconButton
            aria-label="تغيير المظهر"
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          >
            {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav">
        <Drawer
          variant={mobile ? 'temporary' : 'permanent'}
          open={mobile ? open : true}
          onClose={() => setOpen(false)}
          anchor="right"
          slotProps={{ transition: { direction: 'left' } }}
          sx={{ '& .MuiDrawer-paper': { width, boxSizing: 'border-box' } }}
        >
          {menu}
        </Drawer>
        <WipeDialog open={wipe} onClose={() => setWipe(false)} />
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          mr: mobile ? 0 : `${width}px`,
          mt: 8,
          minWidth: 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
