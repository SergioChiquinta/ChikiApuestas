import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();
const dbPath = path.resolve(process.cwd(), process.env.EXCEL_PATH || './data/chiki_pronosticos.xlsx');
const backupDir = path.resolve(process.cwd(), './backups');

function readWorkbook() {
  if (!fs.existsSync(dbPath)) {
    throw Object.assign(new Error(`No existe el Excel: ${dbPath}`), { status: 500 });
  }
  return XLSX.readFile(dbPath, { cellDates: true });
}

function rowsFrom(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw Object.assign(new Error(`No existe la hoja ${sheetName}`), { status: 500 });
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function replaceRows(workbook, sheetName, rows) {
  workbook.Sheets[sheetName] = XLSX.utils.json_to_sheet(rows);
  if (!workbook.SheetNames.includes(sheetName)) workbook.SheetNames.push(sheetName);
}

function persist(workbook) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });

  if (fs.existsSync(dbPath)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(dbPath, path.join(backupDir, `chiki-${stamp}.xlsx`));
  }

  // XLSX deduce el formato a partir de la extensión. El archivo temporal
  // debe terminar en .xlsx; una extensión .tmp provoca "Unrecognized bookType".
  const tempPath = path.join(
    path.dirname(dbPath),
    `.${path.basename(dbPath, path.extname(dbPath))}-${process.pid}-${Date.now()}.tmp.xlsx`
  );

  try {
    XLSX.writeFile(workbook, tempPath, { bookType: 'xlsx' });
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    fs.renameSync(tempPath, dbPath);
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      throw Object.assign(
        new Error('No se pudo guardar el Excel. Ciérralo en Excel y vuelve a intentarlo.'),
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function readSheet(sheetName) {
  return mutex.runExclusive(() => rowsFrom(readWorkbook(), sheetName));
}

export async function mutateWorkbook(callback) {
  return mutex.runExclusive(async () => {
    const workbook = readWorkbook();
    const helpers = {
      get: (sheetName) => rowsFrom(workbook, sheetName),
      set: (sheetName, rows) => replaceRows(workbook, sheetName, rows)
    };
    const result = await callback(helpers);
    persist(workbook);
    return result;
  });
}
