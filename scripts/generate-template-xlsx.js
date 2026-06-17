const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { ALUMNI_COLUMNS } = require('../src/data/alumniColumns');

const headers = ALUMNI_COLUMNS.map((col) => col.header);

const worksheet = XLSX.utils.aoa_to_sheet([headers]);
worksheet['!cols'] = headers.map(() => ({ wch: 24 }));

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumni');

const outDir = path.join(__dirname, '..', 'templates');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'alumni_tracer_template.xlsx');
XLSX.writeFile(workbook, outPath);

console.log('Template written to', outPath);
