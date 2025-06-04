import * as XLSX from 'xlsx';

export async function exportToExcel(data: any[], type: 'tickets' | 'reports', filename: string) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  let headers: string[];
  let rows: any[][];

  if (type === 'tickets') {
    headers = [
      'Ticket No',
      'Date',
      'Project Type',
      'Received By',
      'Site Name',
      'Contact Person',
      'Mobile',
      'Address',
      'Issue',
      'Remark Details',
      'Attended By',
      'Attended Date',
      'Ticket Status',
      'Closing Date',
      'Paid Status',
      'Amount Received',
      'Feedback',
      'Feedback Date',
      'Feedback Taken By',
      'Final Remark'
    ];

    rows = data.map(ticket => [
      ticket.ticketNo || '',
      ticket.date ? new Date(ticket.date).toLocaleDateString() : '',
      ticket.projectType || '',
      ticket.receivedBy || '',
      ticket.siteName || '',
      ticket.contactPerson || '',
      ticket.mobile || '',
      ticket.address || '',
      ticket.issue || '',
      ticket.remarkDetails || '',
      ticket.attendedBy || '',
      ticket.attendedDate ? new Date(ticket.attendedDate).toLocaleDateString() : '',
      ticket.ticketStatus || '',
      ticket.closingDate ? new Date(ticket.closingDate).toLocaleDateString() : '',
      ticket.paidStatus || '',
      ticket.amountReceived || '',
      ticket.feedback || '',
      ticket.feedbackDate ? new Date(ticket.feedbackDate).toLocaleDateString() : '',
      ticket.feedbackTakenBy || '',
      ticket.finalRemark || ''
    ]);
  } else {
    headers = [
      'Name',
      'Date',
      'KM In',
      'KM Out',
      'Site 1',
      'Service Report 1',
      'Site 2',
      'Service Report 2',
      'Site 3',
      'Site 4',
      'Service Report 3',
      'Transport Mode',
      'Total KM',
      'Amount',
      'Paid On'
    ];

    rows = data.map(report => [
      report.name || '',
      report.date ? new Date(report.date).toLocaleDateString() : '',
      report.kmIn || '',
      report.kmOut || '',
      report.site1 || '',
      report.serviceReport1 || '',
      report.site2 || '',
      report.serviceReport2 || '',
      report.site3 || '',
      report.site4 || '',
      report.serviceReport3 || '',
      report.transportMode || '',
      report.totalKm || '',
      report.amount || '',
      report.paidOn ? new Date(report.paidOn).toLocaleDateString() : ''
    ]);
  }

  // Create worksheet
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-size columns
  const colWidths = headers.map((header, i) => {
    const maxWidth = Math.max(
      header.length,
      ...rows.map(row => String(row[i] || '').length)
    );
    return { width: Math.min(maxWidth + 2, 50) };
  });
  worksheet['!cols'] = colWidths;

  // Style headers
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "1E40AF" } },
      font: { color: { rgb: "FFFFFF" } }
    };
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, type === 'tickets' ? 'Tickets' : 'Reports');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, finalFilename);
}
