import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Component, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { isWipeConfirmed, WIPE_CONFIRM_WORD } from '../services/backupService';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', mt: 8 }}>
          <Typography variant="h5" color="error" gutterBottom>
            حدث خطأ غير متوقع أثناء عرض الواجهة
          </Typography>
          <Typography color="text.secondary" mb={3}>
            بياناتك المحلية محفوظة في المتصفح. يمكنك إعادة تحميل الصفحة للمتابعة.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            إعادة تحميل التطبيق
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export const PageTitle = ({ title, subtitle, action }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 3,
      gap: 2,
      flexWrap: 'wrap',
    }}
  >
    <Box>
      <Typography variant="h4">{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        {subtitle}
      </Typography>
    </Box>
    {action}
  </Box>
);

export const StatCard = ({ title, value, icon, color = 'primary.main' }) => (
  <Card sx={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
    <Box sx={{ height: 4, bgcolor: color, width: '100%' }} />
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
        <Box>
          <Typography color="text.secondary" fontWeight={600} variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ mt: 1, fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            color,
            fontSize: 32,
            width: 52,
            height: 52,
            borderRadius: 3.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: theme =>
              color === 'secondary.main'
                ? alpha(theme.palette.secondary.main, 0.14)
                : alpha(theme.palette.primary.main, 0.12),
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const StatusChip = ({ active }) => (
  <Chip size="small" color={active ? 'success' : 'default'} label={active ? 'نشط' : 'غير نشط'} />
);

export function Confirm({ open, title, text, onYes, onClose }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{text}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button color="error" variant="contained" onClick={onYes}>
          تأكيد
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function Notices() {
  const { notice, setNotice } = useApp();
  return (
    <Snackbar open={!!notice} autoHideDuration={4000} onClose={() => setNotice(null)}>
      <Alert severity={notice?.type || 'info'} variant="filled">
        {notice?.text}
      </Alert>
    </Snackbar>
  );
}

export function WipeDialog({ open, onClose }) {
  const { wipeAll, manualBackup } = useApp();
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) setText('');
  }, [open]);

  const ok = isWipeConfirmed(text);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle color="error">مسح شامل لجميع البيانات</DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          سيتم حذف جميع المولدات وسجلات التشغيل نهائيًا من هذا المتصفح، ولا يمكن التراجع عن ذلك.
        </Alert>
        <Typography mb={2}>
          يُنصح بتنزيل نسخة احتياطية قبل المسح. سيُنزّل التطبيق نسخة أمان تلقائيًا قبل التنفيذ.
        </Typography>
        <TextField
          fullWidth
          autoFocus
          label={`اكتب «${WIPE_CONFIRM_WORD}» للتأكيد`}
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button onClick={manualBackup}>نسخة احتياطية</Button>
        <Button
          color="error"
          variant="contained"
          disabled={!ok}
          onClick={() => {
            if (ok && wipeAll()) onClose();
          }}
        >
          مسح نهائي
        </Button>
      </DialogActions>
    </Dialog>
  );
}
