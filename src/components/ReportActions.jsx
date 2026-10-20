import { useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
} from '@mui/material';
import { FileDownloadRounded, PictureAsPdfRounded, PrintRounded } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import {
  enrich,
  exportCSV,
  exportExcel,
  exportPDF,
  reportLabels,
} from '../services/reportService';

const defaults = [
  'date',
  'day',
  'generatorNumber',
  'generatorName',
  'previousReading',
  'currentReading',
  'operatingHours',
  'recordTypeLabel',
  'notes',
];

export default function ReportActions({ logs, generators, filtersText }) {
  const [open, setOpen] = useState(false);
  const [cols, setCols] = useState(defaults);
  const { setNotice } = useApp() || {};
  const data = useMemo(() => enrich(logs, generators), [logs, generators]);

  const toggle = c => setCols(x => (x.includes(c) ? x.filter(y => y !== c) : [...x, c]));

  const handlePrintOrPDF = () => {
    const ok = exportPDF(data, cols, 'تقرير تشغيل المولدات', filtersText);
    if (!ok) {
      setNotice?.({
        type: 'error',
        text: 'تعذر فتح نافذة التقرير. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.',
      });
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button startIcon={<FileDownloadRounded />} variant="outlined" onClick={() => setOpen(true)}>
          تصدير
        </Button>
        <Button startIcon={<PrintRounded />} variant="outlined" onClick={handlePrintOrPDF}>
          طباعة / PDF
        </Button>
      </Stack>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>اختيار أعمدة التقرير</DialogTitle>
        <DialogContent>
          <FormGroup>
            {Object.entries(reportLabels).map(([k, v]) => (
              <FormControlLabel
                key={k}
                control={<Checkbox checked={cols.includes(k)} onChange={() => toggle(k)} />}
                label={v}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => exportCSV(data, cols, 'تقرير-التشغيل')} disabled={!cols.length}>
            CSV
          </Button>
          <Button
            color="secondary"
            variant="outlined"
            startIcon={<PictureAsPdfRounded />}
            onClick={handlePrintOrPDF}
            disabled={!cols.length}
          >
            PDF
          </Button>
          <Button
            variant="contained"
            onClick={() => exportExcel(data, cols, 'تقرير-التشغيل', filtersText)}
            disabled={!cols.length}
          >
            Excel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
