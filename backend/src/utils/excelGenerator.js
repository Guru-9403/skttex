import zlib from 'zlib';

// Fast CRC32 implementation
const makeCrcTable = () => {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
};

const crcTable = makeCrcTable();

const crc32 = (buf) => {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
};

// Pure Node.js ZIP archive builder
class ZipArchive {
  constructor() {
    this.files = [];
  }

  addFile(name, content) {
    const dataBuf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const compressed = zlib.deflateRawSync(dataBuf);
    const checksum = crc32(dataBuf);

    this.files.push({
      name,
      uncompressed: dataBuf,
      compressed,
      checksum,
      size: dataBuf.length,
      compressedSize: compressed.length,
    });
  }

  toBuffer() {
    const localHeaders = [];
    let offset = 0;
    const fileRecords = [];

    for (const f of this.files) {
      const nameBuf = Buffer.from(f.name, 'utf8');
      const header = Buffer.alloc(30);

      header.writeUInt32LE(0x04034b50, 0); // Local header signature
      header.writeUInt16LE(20, 4); // Version needed
      header.writeUInt16LE(0, 6); // General flags
      header.writeUInt16LE(8, 8); // Compression method (8 = deflate)
      header.writeUInt16LE(0, 10); // Mod time
      header.writeUInt16LE(0, 12); // Mod date
      header.writeUInt32LE(f.checksum, 14);
      header.writeUInt32LE(f.compressedSize, 18);
      header.writeUInt32LE(f.size, 22);
      header.writeUInt16LE(nameBuf.length, 26);
      header.writeUInt16LE(0, 28); // Extra length

      fileRecords.push({
        file: f,
        nameBuf,
        offset,
        header,
      });

      localHeaders.push(header, nameBuf, f.compressed);
      offset += 30 + nameBuf.length + f.compressedSize;
    }

    const centralHeaders = [];
    let centralDirSize = 0;

    for (const r of fileRecords) {
      const cd = Buffer.alloc(46);
      cd.writeUInt32LE(0x02014b50, 0); // Central directory signature
      cd.writeUInt16LE(20, 4); // Version made by
      cd.writeUInt16LE(20, 6); // Version needed
      cd.writeUInt16LE(0, 8); // Flags
      cd.writeUInt16LE(8, 10); // Compression method
      cd.writeUInt16LE(0, 12); // Mod time
      cd.writeUInt16LE(0, 14); // Mod date
      cd.writeUInt32LE(r.file.checksum, 16);
      cd.writeUInt32LE(r.file.compressedSize, 20);
      cd.writeUInt32LE(r.file.size, 24);
      cd.writeUInt16LE(r.nameBuf.length, 28);
      cd.writeUInt16LE(0, 30); // Extra field len
      cd.writeUInt16LE(0, 32); // File comment len
      cd.writeUInt16LE(0, 34); // Disk num
      cd.writeUInt16LE(0, 36); // Internal attrs
      cd.writeUInt32LE(0, 38); // External attrs
      cd.writeUInt32LE(r.offset, 42); // Offset of local header

      centralHeaders.push(cd, r.nameBuf);
      centralDirSize += 46 + r.nameBuf.length;
    }

    // End of Central Directory
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
    eocd.writeUInt16LE(0, 4); // Disk number
    eocd.writeUInt16LE(0, 6); // Start disk
    eocd.writeUInt16LE(this.files.length, 8); // Disk entries
    eocd.writeUInt16LE(this.files.length, 10); // Total entries
    eocd.writeUInt32LE(centralDirSize, 12);
    eocd.writeUInt32LE(offset, 16); // Central directory start offset
    eocd.writeUInt16LE(0, 20); // Comment length

    return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
  }
}

// Convert a column number (0-based) to Excel letters (0 -> A, 1 -> B, etc.)
function colLetter(colIdx) {
  let temp;
  let letter = '';
  let col = colIdx + 1;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    col = Math.floor((col - temp) / 26);
  }
  return letter;
}

// Escape XML special chars
function escapeXml(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Build a worksheet XML from rows of cells
// row: array of values or { v: val, s: styleIdx, t: type }
function buildSheetXml(rows, colWidths = []) {
  let colsXml = '';
  if (colWidths.length > 0) {
    colsXml = '<cols>' + colWidths.map((w, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${w || 15}" customWidth="1"/>`).join('') + '</cols>';
  }

  let sheetDataXml = '<sheetData>';
  for (let r = 0; r < rows.length; r++) {
    const rowNum = r + 1;
    const row = rows[r];
    sheetDataXml += `<row r="${rowNum}">`;

    for (let c = 0; c < row.length; c++) {
      const cellRef = `${colLetter(c)}${rowNum}`;
      const cell = row[c];

      if (cell === null || cell === undefined || cell === '') {
        continue;
      }

      let val = cell;
      let style = 0;

      if (typeof cell === 'object' && cell !== null && 'v' in cell) {
        val = cell.v;
        style = cell.s || 0;
      }

      if (typeof val === 'number') {
        sheetDataXml += `<c r="${cellRef}" s="${style}"><v>${val}</v></c>`;
      } else {
        const strVal = escapeXml(val);
        sheetDataXml += `<c r="${cellRef}" t="inlineStr" s="${style}"><is><t>${strVal}</t></is></c>`;
      }
    }
    sheetDataXml += '</row>';
  }
  sheetDataXml += '</sheetData>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${colsXml}
  ${sheetDataXml}
</worksheet>`;
}

// Build standard Excel styles XML
function buildStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="14"/><color rgb="FF1E293B"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FF1E293B"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF7A1F2B"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/></border>
    <border>
      <left style="thin"><color rgb="FFD1D5DB"/></left>
      <right style="thin"><color rgb="FFD1D5DB"/></right>
      <top style="thin"><color rgb="FFD1D5DB"/></top>
      <bottom style="thin"><color rgb="FFD1D5DB"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="5">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="4" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;
}

/**
 * Generate a complete, multi-sheet .xlsx workbook buffer
 * @param {Object} data
 * @param {Array} data.stockItems
 * @param {Array} data.inwardTransactions
 * @param {Array} data.outwardTransactions
 * @param {Object} data.summary
 */
export function generateStockExcelWorkbook(data) {
  const { stockItems = [], inwardTransactions = [], outwardTransactions = [], summary = {} } = data;

  const zip = new ZipArchive();

  // 1. Complete Stock Details Sheet
  const sheet1Rows = [
    [{ v: 'SREE KAVINYA TEX – COMPLETE STOCK INVENTORY REPORT', s: 2 }],
    [{ v: `Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} | Total Items: ${stockItems.length}`, s: 0 }],
    [],
    [
      { v: 'Item Code', s: 1 },
      { v: 'Item Name', s: 1 },
      { v: 'Category', s: 1 },
      { v: 'Unit', s: 1 },
      { v: 'Available Stock', s: 1 },
      { v: 'Purchase Price (₹)', s: 1 },
      { v: 'Selling Price (₹)', s: 1 },
      { v: 'Unit Margin (₹)', s: 1 },
      { v: 'Total Stock Cost (₹)', s: 1 },
      { v: 'Total Retail Value (₹)', s: 1 },
      { v: 'Min Alert Threshold', s: 1 },
      { v: 'Stock Status', s: 1 },
      { v: 'Last Updated', s: 1 },
    ],
  ];

  for (const item of stockItems) {
    const costVal = Number((item.currentStock * item.purchasePrice).toFixed(2));
    const retailVal = Number((item.currentStock * item.sellingPrice).toFixed(2));
    const margin = Number((item.sellingPrice - item.purchasePrice).toFixed(2));
    const lastUp = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-IN') : '';
    sheet1Rows.push([
      { v: item.itemCode, s: 0 },
      { v: item.name, s: 0 },
      { v: item.category || 'General', s: 0 },
      { v: item.unit || 'Pieces', s: 0 },
      { v: item.currentStock, s: 0 },
      { v: item.purchasePrice, s: 4 },
      { v: item.sellingPrice, s: 4 },
      { v: margin, s: 4 },
      { v: costVal, s: 4 },
      { v: retailVal, s: 4 },
      { v: item.lowStockThreshold || 10, s: 0 },
      { v: item.status, s: 0 },
      { v: lastUp, s: 0 },
    ]);
  }

  const sheet1ColWidths = [16, 30, 16, 12, 16, 18, 18, 16, 20, 20, 18, 16, 14];
  const sheet1Xml = buildSheetXml(sheet1Rows, sheet1ColWidths);

  // 2. Inward Stock History Sheet
  const sheet2Rows = [
    [{ v: 'SREE KAVINYA TEX – INWARD STOCK TRANSACTION HISTORY', s: 2 }],
    [{ v: `Total Inward Entries: ${inwardTransactions.length}`, s: 0 }],
    [],
    [
      { v: 'Date & Time', s: 1 },
      { v: 'Item Code', s: 1 },
      { v: 'Item Name', s: 1 },
      { v: 'Category', s: 1 },
      { v: 'Inward Qty', s: 1 },
      { v: 'Unit', s: 1 },
      { v: 'Unit Price (₹)', s: 1 },
      { v: 'Total Amount (₹)', s: 1 },
      { v: 'Supplier / Source', s: 1 },
      { v: 'Invoice / Ref #', s: 1 },
      { v: 'Stock Before', s: 1 },
      { v: 'Stock After', s: 1 },
      { v: 'Received By', s: 1 },
      { v: 'Notes', s: 1 },
    ],
  ];

  for (const t of inwardTransactions) {
    const dt = t.date ? new Date(t.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
    sheet2Rows.push([
      { v: dt, s: 0 },
      { v: t.itemCode, s: 0 },
      { v: t.itemName, s: 0 },
      { v: t.category || '', s: 0 },
      { v: t.quantity, s: 0 },
      { v: t.unit || 'Pieces', s: 0 },
      { v: t.unitPrice || 0, s: 4 },
      { v: t.totalAmount || (t.quantity * (t.unitPrice || 0)), s: 4 },
      { v: t.partyName || '-', s: 0 },
      { v: t.referenceNumber || '-', s: 0 },
      { v: t.stockBefore, s: 0 },
      { v: t.stockAfter, s: 0 },
      { v: t.createdByName || 'Admin', s: 0 },
      { v: t.notes || '', s: 0 },
    ]);
  }

  const sheet2ColWidths = [20, 16, 28, 16, 14, 12, 16, 18, 22, 18, 14, 14, 16, 25];
  const sheet2Xml = buildSheetXml(sheet2Rows, sheet2ColWidths);

  // 3. Outward Stock History Sheet
  const sheet3Rows = [
    [{ v: 'SREE KAVINYA TEX – OUTWARD STOCK TRANSACTION HISTORY', s: 2 }],
    [{ v: `Total Outward Entries: ${outwardTransactions.length}`, s: 0 }],
    [],
    [
      { v: 'Date & Time', s: 1 },
      { v: 'Item Code', s: 1 },
      { v: 'Item Name', s: 1 },
      { v: 'Category', s: 1 },
      { v: 'Outward Qty', s: 1 },
      { v: 'Unit', s: 1 },
      { v: 'Unit Price (₹)', s: 1 },
      { v: 'Total Amount (₹)', s: 1 },
      { v: 'Customer / Recipient', s: 1 },
      { v: 'Bill / Order Ref #', s: 1 },
      { v: 'Stock Before', s: 1 },
      { v: 'Stock After', s: 1 },
      { v: 'Issued By', s: 1 },
      { v: 'Notes', s: 1 },
    ],
  ];

  for (const t of outwardTransactions) {
    const dt = t.date ? new Date(t.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
    sheet3Rows.push([
      { v: dt, s: 0 },
      { v: t.itemCode, s: 0 },
      { v: t.itemName, s: 0 },
      { v: t.category || '', s: 0 },
      { v: t.quantity, s: 0 },
      { v: t.unit || 'Pieces', s: 0 },
      { v: t.unitPrice || 0, s: 4 },
      { v: t.totalAmount || (t.quantity * (t.unitPrice || 0)), s: 4 },
      { v: t.partyName || '-', s: 0 },
      { v: t.referenceNumber || '-', s: 0 },
      { v: t.stockBefore, s: 0 },
      { v: t.stockAfter, s: 0 },
      { v: t.createdByName || 'Admin', s: 0 },
      { v: t.notes || '', s: 0 },
    ]);
  }

  const sheet3ColWidths = [20, 16, 28, 16, 14, 12, 16, 18, 22, 18, 14, 14, 16, 25];
  const sheet3Xml = buildSheetXml(sheet3Rows, sheet3ColWidths);

  // 4. Total Stock Summary Sheet
  const sheet4Rows = [
    [{ v: 'SREE KAVINYA TEX – INVENTORY EXECUTIVE SUMMARY', s: 2 }],
    [{ v: `Report Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, s: 0 }],
    [],
    [{ v: 'KEY STOCK PERFORMANCE METRICS', s: 3 }, { v: '', s: 3 }],
    [{ v: 'Metric Description', s: 1 }, { v: 'Value / Total', s: 1 }],
    [{ v: 'Total Stock Item Varieties', s: 0 }, { v: summary.totalItems || stockItems.length, s: 0 }],
    [{ v: 'Total Available Current Stock (Units)', s: 0 }, { v: summary.availableStock || 0, s: 0 }],
    [{ v: 'Total Historical Inward Units', s: 0 }, { v: summary.totalInward || 0, s: 0 }],
    [{ v: 'Total Historical Outward Units', s: 0 }, { v: summary.totalOutward || 0, s: 0 }],
    [{ v: 'Total Inventory Valuation (at Purchase Price)', s: 0 }, { v: summary.totalStockValue || 0, s: 4 }],
    [{ v: 'Total Potential Revenue (at Selling Price)', s: 0 }, { v: summary.totalSellingValue || 0, s: 4 }],
    [{ v: 'Items with Sufficient Stock (In Stock)', s: 0 }, { v: summary.inStockCount || 0, s: 0 }],
    [{ v: 'Low Stock Alerts (Needs Replenishment)', s: 0 }, { v: summary.lowStockCount || 0, s: 0 }],
    [{ v: 'Out of Stock Alerts (Depleted)', s: 0 }, { v: summary.outOfStockCount || 0, s: 0 }],
    [],
    [{ v: 'CATEGORY-WISE STOCK BREAKDOWN', s: 3 }, { v: '', s: 3 }, { v: '', s: 3 }, { v: '', s: 3 }, { v: '', s: 3 }],
    [
      { v: 'Category', s: 1 },
      { v: 'Total Items', s: 1 },
      { v: 'Current Stock', s: 1 },
      { v: 'Total Inward', s: 1 },
      { v: 'Total Outward', s: 1 },
      { v: 'Stock Valuation (₹)', s: 1 },
    ],
  ];

  if (summary.categoryBreakdown && Array.isArray(summary.categoryBreakdown)) {
    for (const cat of summary.categoryBreakdown) {
      sheet4Rows.push([
        { v: cat.category, s: 0 },
        { v: cat.itemCount, s: 0 },
        { v: cat.currentStock, s: 0 },
        { v: cat.inward, s: 0 },
        { v: cat.outward, s: 0 },
        { v: cat.valuation, s: 4 },
      ]);
    }
  }

  const sheet4ColWidths = [38, 22, 18, 18, 18, 24];
  const sheet4Xml = buildSheetXml(sheet4Rows, sheet4ColWidths);

  // Content Types XML
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  // _rels/.rels
  const packageRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // xl/workbook.xml
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Complete Stock Details" sheetId="1" r:id="rId1"/>
    <sheet name="Inward Stock History" sheetId="2" r:id="rId2"/>
    <sheet name="Outward Stock History" sheetId="3" r:id="rId3"/>
    <sheet name="Total Stock Summary" sheetId="4" r:id="rId4"/>
  </sheets>
</workbook>`;

  // xl/_rels/workbook.xml.rels
  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  // Add files to ZIP container
  zip.addFile('[Content_Types].xml', contentTypesXml);
  zip.addFile('_rels/.rels', packageRelsXml);
  zip.addFile('xl/workbook.xml', workbookXml);
  zip.addFile('xl/_rels/workbook.xml.rels', workbookRelsXml);
  zip.addFile('xl/styles.xml', buildStylesXml());
  zip.addFile('xl/worksheets/sheet1.xml', sheet1Xml);
  zip.addFile('xl/worksheets/sheet2.xml', sheet2Xml);
  zip.addFile('xl/worksheets/sheet3.xml', sheet3Xml);
  zip.addFile('xl/worksheets/sheet4.xml', sheet4Xml);

  return zip.toBuffer();
}
