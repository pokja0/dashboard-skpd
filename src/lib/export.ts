import type { DashboardMeta } from './dashboard';
import type { DashboardUnit } from './data';
import { dataset, statusLabels, statusOrder } from './data';
import { dateISO, decimal, num, pct, titleCase } from './format';

const SOURCE = 'Rekap Tim Staf Sekda';
const TITLE = 'Rekap Kinerja Kepala Perangkat Daerah 2026';

function fileStamp(meta: DashboardMeta): string {
  const slug = meta.periodLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `sulbar-perangkat-daerah-${slug}`;
}

function meetingTitle(index: number): string {
  return dataset.meetings[index]?.title ?? 'Rapat';
}

function pdfText(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u00b7\u2022]/g, '|')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

export async function downloadUnitsPdf(
  units: DashboardUnit[],
  meta: DashboardMeta
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 77, 153);
  doc.text(TITLE, 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(43, 63, 87);
  doc.text(pdfText(`Daftar Perangkat Daerah - ${meta.periodLabel}`), 14, 23);
  doc.setFontSize(8.5);
  doc.setTextColor(95, 109, 128);
  doc.text(
    pdfText(
      `Sumber: ${SOURCE} | ${units.length} unit | Diunduh ${new Date().toLocaleDateString('id-ID')}`
    ),
    14,
    28
  );
  doc.setFontSize(7.5);
  doc.text(
    pdfText(
      'Nilai R&P = ((persentase kehadiran + persentase disposisi) / 2) x 30%. Komponen tanpa catatan dianggap 100%.'
    ),
    14,
    32
  );

  const headChangeCount = units.filter((unit) => unit.headChanged).length;
  if (headChangeCount > 0) {
    doc.text(
      pdfText(`* ${headChangeCount} unit memiliki lebih dari satu kepala; lihat detail unit.`),
      14,
      36
    );
  }

  const pageFooter = () => {
    const page = doc.getNumberOfPages();
    doc.setFontSize(7.5);
    doc.setTextColor(120, 130, 145);
    doc.text(`Halaman ${page}`, 283, 203, { align: 'right' });
    doc.text(SOURCE, 14, 203);
  };

  autoTable(doc, {
    startY: headChangeCount > 0 ? 41 : 37,
    head: [['No', 'Perangkat Daerah', 'Kepala', 'Kehadiran', 'Disposisi', 'Nilai R&P', 'Perjalanan']],
    body: units.map((unit, index) => [
      String(index + 1),
      pdfText(unit.short) + (unit.headChanged ? ' *' : ''),
      pdfText(unit.head),
      `${pct(unit.attendance.pct)} (${num(unit.attendance.present)}/${num(unit.attendance.total)})`,
      unit.disposition.total
        ? `${pct(unit.disposition.pct)} (${num(unit.disposition.done)}/${num(unit.disposition.total)})`
        : 'Tidak ada data',
      decimal(unit.reward),
      `${num(unit.travel.total)} trip | ${num(unit.travel.days)} hari`
    ]),
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2, textColor: [11, 32, 56] },
    headStyles: { fillColor: [0, 77, 153], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 246, 240] },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 48 },
      2: { cellWidth: 50 },
      3: { cellWidth: 36 },
      4: { cellWidth: 34 },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 40 }
    },
    didDrawPage: pageFooter
  });

  let nextY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0;
  if (nextY > 140) {
    doc.addPage();
    nextY = 18;
  } else {
    nextY += 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 77, 153);
  doc.text(pdfText(`Rincian status kehadiran per unit - ${meta.periodLabel}`), 14, nextY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(95, 109, 128);
  doc.text('DL = Dinas Luar, TK = Tanpa Keterangan', 14, nextY + 4);

  autoTable(doc, {
    startY: nextY + 7,
    head: [['No', 'Perangkat Daerah', 'Hadir Langsung', 'Diwakili', 'DL', 'Sakit', 'Izin', 'TK', 'Total']],
    body: units.map((unit, index) => [
      String(index + 1),
      pdfText(unit.short),
      String(unit.attendance.statuses.Hadir),
      String(unit.attendance.statuses.Diwakili),
      String(unit.attendance.statuses['Dinas Luar']),
      String(unit.attendance.statuses.Sakit),
      String(unit.attendance.statuses.Izin),
      String(unit.attendance.statuses['Tanpa Keterangan']),
      String(unit.attendance.total)
    ]),
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, textColor: [11, 32, 56] },
    headStyles: { fillColor: [0, 77, 153], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 246, 240] },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' },
      8: { cellWidth: 22, halign: 'right' }
    },
    didDrawPage: pageFooter
  });

  doc.save(`${fileStamp(meta)}.pdf`);
}

export async function downloadUnitsXlsx(
  units: DashboardUnit[],
  meta: DashboardMeta
): Promise<void> {
  const XLSX = await import('xlsx');

  const rows = units.map((unit, index) => ({
    No: index + 1,
    'Perangkat Daerah': unit.short,
    Nama: unit.name,
    Kepala: unit.head,
    'Catatan kepala': unit.headChanged ? 'Pergantian, perlu verifikasi' : '',
    Kelompok: unit.group,
    'Kehadiran (%)': unit.attendance.pct,
    'Kehadiran (catatan)': unit.attendance.present,
    'Hadir Langsung': unit.attendance.statuses.Hadir,
    'Diwakili': unit.attendance.statuses.Diwakili,
    'Dinas Luar': unit.attendance.statuses['Dinas Luar'],
    'Sakit': unit.attendance.statuses.Sakit,
    'Izin': unit.attendance.statuses.Izin,
    'Tanpa Keterangan': unit.attendance.statuses['Tanpa Keterangan'],
    'Total catatan kehadiran': unit.attendance.total,
    'Disposisi (%)': unit.disposition.pct ?? '',
    'Selesai': unit.disposition.done,
    'Total disposisi': unit.disposition.total,
    'Belum selesai': unit.disposition.pending,
    'Nilai R&P (/30)': unit.reward,
    'Perjalanan (trip)': unit.travel.total,
    'Hari perjalanan': unit.travel.days,
    'Luar daerah': unit.travel.outside
  }));

  const statusRows = units.map((unit, index) => ({
    No: index + 1,
    'Perangkat Daerah': unit.short,
    'Hadir Langsung': unit.attendance.statuses.Hadir,
    Diwakili: unit.attendance.statuses.Diwakili,
    'Dinas Luar': unit.attendance.statuses['Dinas Luar'],
    Sakit: unit.attendance.statuses.Sakit,
    Izin: unit.attendance.statuses.Izin,
    'Tanpa Keterangan': unit.attendance.statuses['Tanpa Keterangan'],
    Total: unit.attendance.total
  }));

  const info = [
    { Keterangan: 'Judul', Nilai: TITLE },
    { Keterangan: 'Periode', Nilai: meta.periodLabel },
    { Keterangan: 'Sumber', Nilai: SOURCE },
    {
      Keterangan: 'Rumus Nilai R&P',
      Nilai:
        '((persentase kehadiran + persentase disposisi) / 2) x 30%; komponen tanpa catatan dianggap 100%'
    },
    { Keterangan: 'Jumlah unit', Nilai: units.length },
    { Keterangan: 'Diunduh', Nilai: new Date().toLocaleString('id-ID') }
  ];

  const workbook = XLSX.utils.book_new();
  const dataSheet = XLSX.utils.json_to_sheet(rows);
  const statusSheet = XLSX.utils.json_to_sheet(statusRows);
  const infoSheet = XLSX.utils.json_to_sheet(info);

  dataSheet['!cols'] = [
    { wch: 5 },
    { wch: 34 },
    { wch: 52 },
    { wch: 38 },
    { wch: 26 },
    { wch: 18 },
    { wch: 13 },
    { wch: 16 },
    { wch: 16 },
    { wch: 9 },
    { wch: 11 },
    { wch: 8 },
    { wch: 8 },
    { wch: 16 },
    { wch: 20 },
    { wch: 13 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 13 },
    { wch: 16 },
    { wch: 15 },
    { wch: 12 }
  ];
  infoSheet['!cols'] = [{ wch: 22 }, { wch: 60 }];
  statusSheet['!cols'] = [
    { wch: 5 },
    { wch: 34 },
    { wch: 16 },
    { wch: 9 },
    { wch: 11 },
    { wch: 8 },
    { wch: 8 },
    { wch: 16 },
    { wch: 8 }
  ];

  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Perangkat Daerah');
  XLSX.utils.book_append_sheet(workbook, statusSheet, 'Rekap Kehadiran');
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Info');
  XLSX.writeFile(workbook, `${fileStamp(meta)}.xlsx`);
}

export async function downloadUnitPdf(unit: DashboardUnit, meta: DashboardMeta): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 77, 153);
  doc.text(TITLE, 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(11, 32, 56);
  doc.text(pdfText(unit.short), 14, 23);

  doc.setFontSize(9);
  doc.setTextColor(43, 63, 87);
  doc.text(pdfText(unit.name), 14, 29);
  doc.text(pdfText(`Kepala: ${unit.head}`), 14, 34);
  doc.text(pdfText(`Kelompok: ${unit.group} | Periode: ${meta.periodLabel}`), 14, 39);

  doc.setFontSize(8.5);
  doc.setTextColor(95, 109, 128);
  doc.text(
    pdfText(
      `Kehadiran ${pct(unit.attendance.pct)} (4 status, ${num(unit.attendance.present)}/${num(unit.attendance.total)}) | ` +
        `Disposisi ${unit.disposition.total ? pct(unit.disposition.pct) : 'tidak ada data'} | ` +
        `Perjalanan ${num(unit.travel.total)} trip / ${num(unit.travel.days)} hari`
    ),
    14,
    45
  );
  doc.text(
    pdfText(
      `Nilai R&P: ${decimal(unit.reward)} / 30 | ` +
        'Rumus: ((kehadiran + disposisi) / 2) x 30%; komponen tanpa catatan = 100%'
    ),
    14,
    50
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(43, 63, 87);
  const statusText =
    'Rincian kehadiran: ' +
    statusOrder
      .map((status) => `${statusLabels[status]} ${num(unit.attendance.statuses[status])}`)
      .join(' | ');
  const statusLines = doc.splitTextToSize(pdfText(statusText), 260) as string[];
  doc.text(statusLines, 14, 55);
  let cursor = 55 + statusLines.length * 3.6 + 4;

  if (unit.leadership?.length) {
    const history = unit.leadership
      .map(
        (period) =>
          `${period.name} (${period.role}, ${dateISO(period.from)}-${dateISO(period.to)})${
            period.verified ? '' : ' [perlu verifikasi]'
          }`
      )
      .join('; ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(43, 63, 87);
    const lines = doc.splitTextToSize(pdfText(`Riwayat kepala: ${history}`), 260) as string[];
    doc.text(lines, 14, cursor);
    cursor += lines.length * 3.6 + 4;
  }

  const pageFooter = () => {
    const page = doc.getNumberOfPages();
    doc.setFontSize(7.5);
    doc.setTextColor(120, 130, 145);
    doc.text(`Halaman ${page}`, 283, 203, { align: 'right' });
    doc.text(`Sumber: ${SOURCE}`, 14, 203);
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 77, 153);
  doc.text(`Disposisi (${unit.records.dispositions.length})`, 14, cursor);
  autoTable(doc, {
    startY: cursor + 3,
    head: [['No', 'Tanggal', 'Pengirim', 'Perihal', 'Tenggat', 'Status']],
    body: unit.records.dispositions.map((item, index) => [
      String(index + 1),
      pdfText(dateISO(item.d)),
      pdfText(item.sender),
      pdfText(item.subject),
      pdfText(dateISO(item.due)),
      pdfText(item.status)
    ]),
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, textColor: [11, 32, 56] },
    headStyles: { fillColor: [0, 77, 153], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 246, 240] },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 46 },
      3: { cellWidth: 120 },
      4: { cellWidth: 26 },
      5: { cellWidth: 22 }
    },
    didDrawPage: pageFooter
  });
  cursor = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursor;

  if (cursor > 160) {
    doc.addPage();
    cursor = 18;
  } else {
    cursor += 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 77, 153);
  doc.text(`Perjalanan Dinas (${unit.records.travel.length})`, 14, cursor);
  autoTable(doc, {
    startY: cursor + 3,
    head: [['No', 'Nama', 'Mulai', 'Selesai', 'Hari', 'Jenis', 'Tujuan', 'Kegiatan']],
    body: unit.records.travel.map((item, index) => [
      String(index + 1),
      pdfText(item.name),
      pdfText(dateISO(item.d)),
      pdfText(dateISO(item.end)),
      String(item.days),
      pdfText(item.kind),
      pdfText(titleCase(item.dest)),
      pdfText(item.subject)
    ]),
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, textColor: [11, 32, 56] },
    headStyles: { fillColor: [0, 77, 153], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 246, 240] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 34 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 9, halign: 'center' },
      5: { cellWidth: 18 },
      6: { cellWidth: 34 },
      7: { cellWidth: 80 }
    },
    didDrawPage: pageFooter
  });
  cursor = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursor;

  if (cursor > 160) {
    doc.addPage();
    cursor = 18;
  } else {
    cursor += 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 77, 153);
  doc.text(`Kehadiran (${unit.records.attendance.length})`, 14, cursor);
  autoTable(doc, {
    startY: cursor + 3,
    head: [['No', 'Tanggal', 'Rapat', 'Status']],
    body: unit.records.attendance.map((item, index) => [
      String(index + 1),
      pdfText(dateISO(item.d)),
      pdfText(meetingTitle(item.m)),
      pdfText(item.status)
    ]),
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, textColor: [11, 32, 56] },
    headStyles: { fillColor: [0, 77, 153], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 246, 240] },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 190 },
      3: { cellWidth: 22 }
    },
    didDrawPage: pageFooter
  });

  doc.save(`sulbar-${unit.id}-${fileStamp(meta).replace('sulbar-perangkat-daerah-', '')}.pdf`);
}

export async function downloadUnitXlsx(unit: DashboardUnit, meta: DashboardMeta): Promise<void> {
  const XLSX = await import('xlsx');

  const leadershipInfo = (unit.leadership ?? []).map((period, index) => ({
    Keterangan: `Kepala ${index + 1}`,
    Nilai:
      `${period.name} (${period.role}, ${dateISO(period.from)}-${dateISO(period.to)})` +
      (period.verified ? '' : ' - perlu verifikasi')
  }));

  const info = [
    { Keterangan: 'Judul', Nilai: TITLE },
    { Keterangan: 'Perangkat Daerah', Nilai: unit.short },
    { Keterangan: 'Nama', Nilai: unit.name },
    { Keterangan: 'Kepala', Nilai: unit.head },
    ...leadershipInfo,
    { Keterangan: 'Kelompok', Nilai: unit.group },
    { Keterangan: 'Periode', Nilai: meta.periodLabel },
    { Keterangan: 'Sumber', Nilai: SOURCE },
    { Keterangan: 'Kehadiran (%)', Nilai: unit.attendance.pct },
    { Keterangan: 'Kehadiran (catatan)', Nilai: `${unit.attendance.present}/${unit.attendance.total}` },
    ...statusOrder.map((status) => ({
      Keterangan: statusLabels[status],
      Nilai: `${unit.attendance.statuses[status]} (${
        unit.attendance.total
          ? pct((unit.attendance.statuses[status] / unit.attendance.total) * 100)
          : '0%'
      })`
    })),
    {
      Keterangan: 'Disposisi (%)',
      Nilai: unit.disposition.total ? (unit.disposition.pct ?? '') : 'Tidak ada data'
    },
    { Keterangan: 'Disposisi selesai', Nilai: `${unit.disposition.done}/${unit.disposition.total}` },
    { Keterangan: 'Perjalanan', Nilai: `${unit.travel.total} trip / ${unit.travel.days} hari` },
    { Keterangan: 'Luar daerah', Nilai: `${unit.travel.outside} trip` },
    { Keterangan: 'Nilai R&P (/30)', Nilai: unit.reward },
    {
      Keterangan: 'Rumus Nilai R&P',
      Nilai:
        '((persentase kehadiran + persentase disposisi) / 2) x 30%; komponen tanpa catatan dianggap 100%'
    },
    { Keterangan: 'Diunduh', Nilai: new Date().toLocaleString('id-ID') }
  ];

  const dispositions = unit.records.dispositions.map((item, index) => ({
    No: index + 1,
    Tanggal: dateISO(item.d),
    Pengirim: item.sender,
    Perihal: item.subject,
    Tenggat: dateISO(item.due),
    Status: item.status,
    Progres: item.progress
  }));

  const travel = unit.records.travel.map((item, index) => ({
    No: index + 1,
    Nama: item.name,
    Mulai: dateISO(item.d),
    Selesai: dateISO(item.end),
    Hari: item.days,
    Jenis: item.kind,
    Tujuan: titleCase(item.dest),
    Kegiatan: item.subject
  }));

  const attendance = unit.records.attendance.map((item, index) => ({
    No: index + 1,
    Tanggal: dateISO(item.d),
    Rapat: meetingTitle(item.m),
    Status: item.status
  }));

  const statusSummary = [
    ...statusOrder.map((status) => ({
      Status: statusLabels[status],
      Jumlah: unit.attendance.statuses[status],
      Persentase: unit.attendance.total
        ? pct((unit.attendance.statuses[status] / unit.attendance.total) * 100)
        : '0%'
    })),
    {
      Status: 'Total',
      Jumlah: unit.attendance.total,
      Persentase: unit.attendance.total ? '100%' : '0%'
    }
  ];

  const workbook = XLSX.utils.book_new();

  const infoSheet = XLSX.utils.json_to_sheet(info);
  infoSheet['!cols'] = [{ wch: 24 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Ringkasan');

  const statusSheet = XLSX.utils.json_to_sheet(statusSummary);
  statusSheet['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, statusSheet, 'Rekap Kehadiran');

  const dispSheet = XLSX.utils.json_to_sheet(dispositions);
  dispSheet['!cols'] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 34 },
    { wch: 72 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(workbook, dispSheet, 'Disposisi');

  const travelSheet = XLSX.utils.json_to_sheet(travel);
  travelSheet['!cols'] = [
    { wch: 5 },
    { wch: 34 },
    { wch: 14 },
    { wch: 14 },
    { wch: 7 },
    { wch: 16 },
    { wch: 30 },
    { wch: 72 }
  ];
  XLSX.utils.book_append_sheet(workbook, travelSheet, 'Perjalanan');

  const attSheet = XLSX.utils.json_to_sheet(attendance);
  attSheet['!cols'] = [{ wch: 5 }, { wch: 14 }, { wch: 90 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, attSheet, 'Kehadiran');

  XLSX.writeFile(
    workbook,
    `sulbar-${unit.id}-${fileStamp(meta).replace('sulbar-perangkat-daerah-', '')}.xlsx`
  );
}
