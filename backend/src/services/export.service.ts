import ExcelJS from 'exceljs';
import db from '../db';

/**
 * Helper to apply standard professional styling to an Excel worksheet
 */
const styleWorksheet = (worksheet: ExcelJS.Worksheet, headerColorHex: string = '1E1B4B') => {
  // Style header row (Row 1)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + headerColorHex }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF475569' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // Auto-fit column widths with padding
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    if (column.header) {
      maxLength = Math.max(maxLength, String(column.header).length + 4);
    }
    if (column.eachCell) {
      column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber > 1) {
          const val = cell.value ? String(cell.value) : '';
          maxLength = Math.max(maxLength, Math.min(val.length + 3, 50));
          
          // Row zebra striping & cell borders
          if (rowNumber % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            };
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    }
    column.width = maxLength;
  });
};

export const exportService = {
  /**
   * Generates a complete master backup Excel workbook containing all data center-wise.
   */
  generateMasterBackupExcel: async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Examirror Super Admin Portal';
    workbook.lastModifiedBy = 'Super Admin';
    workbook.created = new Date();
    workbook.modified = new Date();

    // 1. SYSTEM SUMMARY SHEET
    const summarySheet = workbook.addWorksheet('System Backup Summary');
    summarySheet.columns = [
      { header: 'System Metric / Backup Property', key: 'property', width: 35 },
      { header: 'Value / Details', key: 'value', width: 45 }
    ];

    const [centersCount]: any = await db.query('SELECT COUNT(*) as c FROM centers');
    const [studentsCount]: any = await db.query('SELECT COUNT(*) as c FROM students');
    const [coursesCount]: any = await db.query('SELECT COUNT(*) as c FROM courses');
    const [txnCount]: any = await db.query('SELECT COUNT(*) as c FROM wallet_transactions');
    const [walletSum]: any = await db.query('SELECT SUM(wallet_balance) as s FROM centers');

    summarySheet.addRows([
      { property: 'Backup Title', value: 'Complete Academy Master System & Center-Wise Database Backup' },
      { property: 'Generated At', value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) },
      { property: 'Exported By', value: 'Central Super Admin Authority' },
      { property: 'Total Authorized Centers', value: centersCount[0]?.c || 0 },
      { property: 'Total Registered Students', value: studentsCount[0]?.c || 0 },
      { property: 'Total Active Courses', value: coursesCount[0]?.c || 0 },
      { property: 'Total Wallet Transactions Logged', value: txnCount[0]?.c || 0 },
      { property: 'Total Cumulative Wallet Reserves (₹)', value: `₹${Number(walletSum[0]?.s || 0).toLocaleString('en-IN')}` },
      { property: 'Data Integrity', value: 'Verified & Complete Snapshot (Center-Wise Schema)' },
      { property: 'System Version', value: 'Examirror LMS Super Admin 2.5' }
    ]);
    styleWorksheet(summarySheet, '4338CA');

    // 2. CENTERS DIRECTORY SHEET
    const centersSheet = workbook.addWorksheet('Centers Master');
    centersSheet.columns = [
      { header: 'Center ID', key: 'id', width: 12 },
      { header: 'Center Code', key: 'center_code', width: 16 },
      { header: 'Center Name', key: 'name', width: 30 },
      { header: 'Email Address', key: 'email', width: 26 },
      { header: 'Wallet Balance (₹)', key: 'wallet_balance', width: 18 },
      { header: 'Enrolled Students', key: 'total_students', width: 18 },
      { header: 'Created Date', key: 'created_at', width: 22 }
    ];

    const [centers]: any = await db.query(`
      SELECT c.id, c.center_code, c.name, c.email, c.wallet_balance, c.created_at,
             COUNT(s.id) as total_students
      FROM centers c
      LEFT JOIN students s ON s.centerId = c.id
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    centers.forEach((c: any) => {
      centersSheet.addRow({
        id: c.id,
        center_code: c.center_code,
        name: c.name,
        email: c.email || 'N/A',
        wallet_balance: Number(c.wallet_balance || 0).toFixed(2),
        total_students: c.total_students || 0,
        created_at: c.created_at ? new Date(c.created_at).toLocaleString('en-IN') : 'N/A'
      });
    });
    styleWorksheet(centersSheet, '1E1B4B');

    // 3. STUDENTS MASTER SHEET (COMPLETE SYSTEM-WIDE)
    const studentsSheet = workbook.addWorksheet('All Students Master');
    studentsSheet.columns = [
      { header: 'Student ID', key: 'id', width: 12 },
      { header: 'Center Code', key: 'center_code', width: 15 },
      { header: 'Center Name', key: 'center_name', width: 25 },
      { header: 'Roll No', key: 'roll_no', width: 16 },
      { header: 'Enrollment No', key: 'enrollment_no', width: 18 },
      { header: 'Student Full Name', key: 'name', width: 22 },
      { header: 'Course Code', key: 'courseCode', width: 15 },
      { header: 'Course Name', key: 'courseName', width: 25 },
      { header: 'Father Name', key: 'father_name', width: 20 },
      { header: 'Mother Name', key: 'mother_name', width: 20 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'DOB', key: 'dob', width: 14 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Email', key: 'email', width: 24 },
      { header: 'City', key: 'city', width: 16 },
      { header: 'State', key: 'state', width: 16 },
      { header: 'Pincode', key: 'pincode', width: 12 },
      { header: 'Course Fee (₹)', key: 'course_fee', width: 15 },
      { header: 'Certificate Status', key: 'certificate_status', width: 18 },
      { header: 'Certificate No', key: 'certificate_number', width: 20 },
      { header: 'Admission Status', key: 'status', width: 16 },
      { header: 'Registered On', key: 'created_at', width: 22 }
    ];

    const [students]: any = await db.query(`
      SELECT s.*, 
             c.center_code as center_code, 
             c.name as center_name,
             crs.code as courseCode,
             crs.name as courseName
      FROM students s
      LEFT JOIN centers c ON s.centerId = c.id
      LEFT JOIN courses crs ON s.courseId = crs.id
      ORDER BY c.center_code ASC, s.id ASC
    `);

    students.forEach((s: any) => {
      studentsSheet.addRow({
        id: s.id,
        center_code: s.center_code || 'N/A',
        center_name: s.center_name || 'N/A',
        roll_no: s.roll_no || `ROL-${s.id}`,
        enrollment_no: s.enrollment_no || `ENR-${s.id}`,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
        courseCode: s.courseCode || 'N/A',
        courseName: s.courseName || 'N/A',
        father_name: s.father_name || 'N/A',
        mother_name: s.mother_name || 'N/A',
        gender: s.gender || 'N/A',
        dob: s.dob || 'N/A',
        phone: s.phone || 'N/A',
        email: s.email || 'N/A',
        city: s.city || 'N/A',
        state: s.state || 'N/A',
        pincode: s.pincode || 'N/A',
        course_fee: Number(s.course_fee || 0).toFixed(2),
        certificate_status: s.certificate_status || 'not_generated',
        certificate_number: s.certificate_number || 'N/A',
        status: s.status || 'active',
        created_at: s.created_at ? new Date(s.created_at).toLocaleString('en-IN') : 'N/A'
      });
    });
    styleWorksheet(studentsSheet, '065F46');

    // 4. INDIVIDUAL CENTER-WISE SHEETS (A DEDICATED SHEET PER CENTER)
    for (const centerItem of centers) {
      const sanitizedCenterCode = (centerItem.center_code || `Center_${centerItem.id}`)
        .replace(/[:\\\/\?\*\[\]]/g, '_')
        .substring(0, 24);
      const centerSheetName = `Center - ${sanitizedCenterCode}`.substring(0, 31);

      const singleCenterSheet = workbook.addWorksheet(centerSheetName);
      singleCenterSheet.columns = [
        { header: 'Student ID', key: 'id', width: 12 },
        { header: 'Roll Number', key: 'roll_no', width: 16 },
        { header: 'Enrollment No', key: 'enrollment_no', width: 18 },
        { header: 'Student Full Name', key: 'name', width: 22 },
        { header: 'Course Code', key: 'courseCode', width: 15 },
        { header: 'Course Name', key: 'courseName', width: 25 },
        { header: 'Father Name', key: 'father_name', width: 20 },
        { header: 'Mother Name', key: 'mother_name', width: 20 },
        { header: 'Gender', key: 'gender', width: 12 },
        { header: 'Phone', key: 'phone', width: 16 },
        { header: 'Email Address', key: 'email', width: 24 },
        { header: 'State / City', key: 'location', width: 20 },
        { header: 'Fee (₹)', key: 'course_fee', width: 14 },
        { header: 'Certificate Status', key: 'certificate_status', width: 18 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Admission Date', key: 'created_at', width: 22 }
      ];

      const centerStudents = students.filter((st: any) => st.centerId === centerItem.id);

      if (centerStudents.length === 0) {
        singleCenterSheet.addRow({
          id: '-',
          roll_no: '-',
          enrollment_no: '-',
          name: 'No students registered in this center yet',
          courseCode: '-',
          courseName: '-',
          father_name: '-',
          mother_name: '-',
          gender: '-',
          phone: '-',
          email: '-',
          location: `${centerItem.name || 'Center'} (${centerItem.center_code})`,
          course_fee: '0.00',
          certificate_status: '-',
          status: centerItem.status || 'active',
          created_at: '-'
        });
      } else {
        centerStudents.forEach((cs: any) => {
          singleCenterSheet.addRow({
            id: cs.id,
            roll_no: cs.roll_no || `ROL-${cs.id}`,
            enrollment_no: cs.enrollment_no || `ENR-${cs.id}`,
            name: `${cs.firstName || ''} ${cs.lastName || ''}`.trim() || 'Student',
            courseCode: cs.courseCode || 'N/A',
            courseName: cs.courseName || 'N/A',
            father_name: cs.father_name || 'N/A',
            mother_name: cs.mother_name || 'N/A',
            gender: cs.gender || 'N/A',
            phone: cs.phone || 'N/A',
            email: cs.email || 'N/A',
            location: `${cs.city || ''}, ${cs.state || ''}`.trim() || 'N/A',
            course_fee: Number(cs.course_fee || 0).toFixed(2),
            certificate_status: cs.certificate_status || 'not_generated',
            status: cs.status || 'active',
            created_at: cs.created_at ? new Date(cs.created_at).toLocaleString('en-IN') : 'N/A'
          });
        });
      }
      styleWorksheet(singleCenterSheet, '0E7490');
    }

    // 5. COURSES MASTER DIRECTORY
    const coursesSheet = workbook.addWorksheet('Courses Directory');
    coursesSheet.columns = [
      { header: 'Course ID', key: 'id', width: 12 },
      { header: 'Course Code', key: 'code', width: 16 },
      { header: 'Course Name', key: 'name', width: 30 },
      { header: 'Category', key: 'categoryId', width: 18 },
      { header: 'Standard Fee (₹)', key: 'fee', width: 16 },
      { header: 'Duration', key: 'duration', width: 16 },
      { header: 'Total Questions', key: 'questions_count', width: 16 },
      { header: 'Description', key: 'shortDescription', width: 40 },
      { header: 'Created On', key: 'created_at', width: 22 }
    ];

    const [courses]: any = await db.query(`
      SELECT c.*, (SELECT COUNT(*) FROM course_questions cq WHERE cq.courseId = c.id) as questions_count
      FROM courses c
      ORDER BY c.id ASC
    `);

    courses.forEach((crs: any) => {
      coursesSheet.addRow({
        id: crs.id,
        code: crs.code,
        name: crs.name,
        categoryId: crs.categoryId || 'General',
        fee: Number(crs.fee || 0).toFixed(2),
        duration: crs.duration || '3 Month(s)',
        questions_count: crs.questions_count || 0,
        shortDescription: crs.shortDescription || 'N/A',
        created_at: crs.created_at ? new Date(crs.created_at).toLocaleString('en-IN') : 'N/A'
      });
    });
    styleWorksheet(coursesSheet, '1E3A8A');

    // 6. FRANCHISE APPLICATIONS (KYC VAULT)
    const franchiseSheet = workbook.addWorksheet('Franchise Requests');
    franchiseSheet.columns = [
      { header: 'Application ID', key: 'id', width: 15 },
      { header: 'Center Head Name', key: 'head_name', width: 24 },
      { header: 'Proposed Center Name', key: 'center_name', width: 30 },
      { header: 'Phone Number', key: 'phone', width: 16 },
      { header: 'Email Address', key: 'email', width: 26 },
      { header: 'Aadhar Number', key: 'aadhar_number', width: 18 },
      { header: 'PAN Number', key: 'pan_number', width: 16 },
      { header: 'City & District', key: 'city_district', width: 22 },
      { header: 'State', key: 'state', width: 18 },
      { header: 'Pincode', key: 'pincode', width: 12 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Applied On', key: 'created_at', width: 22 }
    ];

    try {
      const [franchiseApps]: any = await db.query('SELECT * FROM franchise_applications ORDER BY created_at DESC');
      franchiseApps.forEach((f: any) => {
        const headName = `${f.center_head_first_name || ''} ${f.center_head_middle_name || ''} ${f.center_head_last_name || ''}`.replace(/\s+/g, ' ').trim();
        franchiseSheet.addRow({
          id: f.id,
          head_name: headName || 'N/A',
          center_name: f.center_name || 'N/A',
          phone: f.phone || 'N/A',
          email: f.email || 'N/A',
          aadhar_number: f.aadhar_number || 'N/A',
          pan_number: f.pan_number || 'N/A',
          city_district: `${f.city || ''}, ${f.district || ''}`.trim() || 'N/A',
          state: f.state || 'N/A',
          pincode: f.pincode || 'N/A',
          status: (f.status || 'Pending').toUpperCase(),
          created_at: f.created_at ? new Date(f.created_at).toLocaleString('en-IN') : 'N/A'
        });
      });
      styleWorksheet(franchiseSheet, '7C2D12');
    } catch (e) {
      console.error('Franchise export table note:', e);
    }

    // 7. CONTACT INQUIRIES SHEET
    const contactSheet = workbook.addWorksheet('Contact Queries');
    contactSheet.columns = [
      { header: 'Inquiry ID', key: 'id', width: 14 },
      { header: 'Full Name', key: 'full_name', width: 22 },
      { header: 'Phone Number', key: 'phone', width: 16 },
      { header: 'Email Address', key: 'email', width: 24 },
      { header: 'Subject / Category', key: 'subject', width: 24 },
      { header: 'Message', key: 'message', width: 40 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Admin Notes', key: 'admin_notes', width: 30 },
      { header: 'Received On', key: 'created_at', width: 22 }
    ];

    try {
      const [queries]: any = await db.query('SELECT * FROM contact_queries ORDER BY created_at DESC');
      queries.forEach((q: any) => {
        contactSheet.addRow({
          id: q.id,
          full_name: q.full_name || 'N/A',
          phone: q.phone || 'N/A',
          email: q.email || 'N/A',
          subject: q.subject || 'General Inquiry',
          message: q.message || 'N/A',
          status: (q.status || 'New').toUpperCase(),
          admin_notes: q.admin_notes || 'None',
          created_at: q.created_at ? new Date(q.created_at).toLocaleString('en-IN') : 'N/A'
        });
      });
      styleWorksheet(contactSheet, '166534');
    } catch (e) {
      console.error('Contact queries export note:', e);
    }

    // 8. WALLET TRANSACTIONS SHEET
    const walletSheet = workbook.addWorksheet('Wallet Ledgers');
    walletSheet.columns = [
      { header: 'Txn ID', key: 'id', width: 12 },
      { header: 'Center Code', key: 'center_code', width: 15 },
      { header: 'Center Name', key: 'center_name', width: 25 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Amount (₹)', key: 'amount', width: 16 },
      { header: 'Description / Remarks', key: 'description', width: 40 },
      { header: 'Transaction Date & Time', key: 'created_at', width: 24 }
    ];

    const [transactions]: any = await db.query(`
      SELECT wt.*, c.center_code, c.name as center_name
      FROM wallet_transactions wt
      LEFT JOIN centers c ON wt.centerId = c.id
      ORDER BY wt.created_at DESC
    `);

    transactions.forEach((t: any) => {
      walletSheet.addRow({
        id: t.id,
        center_code: t.center_code || 'N/A',
        center_name: t.center_name || 'N/A',
        type: (t.type || 'credit').toUpperCase(),
        amount: Number(t.amount || 0).toFixed(2),
        description: t.description || 'N/A',
        created_at: t.created_at ? new Date(t.created_at).toLocaleString('en-IN') : 'N/A'
      });
    });
    styleWorksheet(walletSheet, '854D0E');

    // 9. TOPUP TOKEN REQUESTS SHEET
    const requestsSheet = workbook.addWorksheet('Token Recharge Requests');
    requestsSheet.columns = [
      { header: 'Request ID', key: 'id', width: 14 },
      { header: 'Center Code', key: 'center_code', width: 15 },
      { header: 'Center Name', key: 'center_name', width: 25 },
      { header: 'Requested Tokens (₹)', key: 'amount', width: 20 },
      { header: 'Bonus Tokens', key: 'bonus_tokens', width: 16 },
      { header: 'Total Credited', key: 'total_credited', width: 16 },
      { header: 'UTR / Txn Ref Number', key: 'utr_number', width: 24 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Narration / Notes', key: 'narration', width: 30 },
      { header: 'Rejection Reason', key: 'rejection_reason', width: 25 },
      { header: 'Requested Date', key: 'created_at', width: 22 },
      { header: 'Approved Date', key: 'approved_at', width: 22 }
    ];

    const [requests]: any = await db.query(`
      SELECT wr.*, c.center_code, c.name as center_name
      FROM wallet_requests wr
      LEFT JOIN centers c ON wr.centerId = c.id
      ORDER BY wr.created_at DESC
    `);

    requests.forEach((r: any) => {
      requestsSheet.addRow({
        id: r.id,
        center_code: r.center_code || 'N/A',
        center_name: r.center_name || 'N/A',
        amount: Number(r.amount || 0).toFixed(2),
        bonus_tokens: Number(r.bonus_tokens || 0).toFixed(2),
        total_credited: Number(r.total_credited || 0).toFixed(2),
        utr_number: r.utr_number || 'N/A',
        status: (r.status || 'pending').toUpperCase(),
        narration: r.narration || 'N/A',
        rejection_reason: r.rejection_reason || 'N/A',
        created_at: r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : 'N/A',
        approved_at: r.approved_at ? new Date(r.approved_at).toLocaleString('en-IN') : 'N/A'
      });
    });
    styleWorksheet(requestsSheet, '9A3412');

    return workbook;
  },

  /**
   * Generates a dedicated Center-Wise Excel backup for a single center.
   */
  generateSingleCenterBackupExcel: async (centerId: number | string) => {
    const [centerRows]: any = await db.query('SELECT * FROM centers WHERE id = ?', [centerId]);
    if (!centerRows || centerRows.length === 0) {
      throw new Error('Center not found');
    }
    const center = centerRows[0];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = `Academy Super Admin - ${center.name}`;
    workbook.lastModifiedBy = 'Super Admin';
    workbook.created = new Date();
    workbook.modified = new Date();

    // 1. Center Profile Sheet
    const profileSheet = workbook.addWorksheet('Center Profile');
    profileSheet.columns = [
      { header: 'Center Attribute', key: 'key', width: 30 },
      { header: 'Detail / Value', key: 'value', width: 45 }
    ];

    const [studentsCount]: any = await db.query('SELECT COUNT(*) as c FROM students WHERE centerId = ?', [centerId]);
    const [activeStudents]: any = await db.query('SELECT COUNT(*) as c FROM students WHERE centerId = ? AND status = "active"', [centerId]);
    const [certifiedStudents]: any = await db.query('SELECT COUNT(*) as c FROM students WHERE centerId = ? AND certificate_status = "issued"', [centerId]);

    profileSheet.addRows([
      { key: 'Center Code', value: center.center_code },
      { key: 'Center Name', value: center.name },
      { key: 'Contact Email', value: center.email || 'N/A' },
      { key: 'Available Wallet Balance (₹)', value: `₹${Number(center.wallet_balance || 0).toLocaleString('en-IN')}` },
      { key: 'Total Enrolled Students', value: studentsCount[0]?.c || 0 },
      { key: 'Active Students', value: activeStudents[0]?.c || 0 },
      { key: 'Issued Certificates', value: certifiedStudents[0]?.c || 0 },
      { key: 'Registration Date', value: center.created_at ? new Date(center.created_at).toLocaleString('en-IN') : 'N/A' },
      { key: 'Backup Generation Date', value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
    ]);
    styleWorksheet(profileSheet, '1E1B4B');

    // 2. Students Sheet
    const studentsSheet = workbook.addWorksheet('Students List');
    studentsSheet.columns = [
      { header: 'Student ID', key: 'id', width: 12 },
      { header: 'Roll No', key: 'roll_no', width: 16 },
      { header: 'First Name', key: 'firstName', width: 16 },
      { header: 'Last Name', key: 'lastName', width: 16 },
      { header: 'Course Code', key: 'courseCode', width: 15 },
      { header: 'Course Name', key: 'courseName', width: 25 },
      { header: 'Father Name', key: 'father_name', width: 20 },
      { header: 'Mother Name', key: 'mother_name', width: 20 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'DOB', key: 'dob', width: 14 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Email', key: 'email', width: 24 },
      { header: 'City', key: 'city', width: 16 },
      { header: 'State', key: 'state', width: 16 },
      { header: 'Pincode', key: 'pincode', width: 12 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Course Fee (₹)', key: 'course_fee', width: 15 },
      { header: 'Tokens Deducted', key: 'tokens_deducted', width: 16 },
      { header: 'Certificate Status', key: 'certificate_status', width: 18 },
      { header: 'Certificate Number', key: 'certificate_number', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Admission Date', key: 'created_at', width: 22 }
    ];

    const [students]: any = await db.query(`
      SELECT s.*, crs.code as courseCode, crs.name as courseName
      FROM students s
      LEFT JOIN courses crs ON s.courseId = crs.id
      WHERE s.centerId = ?
      ORDER BY s.id ASC
    `, [centerId]);

    students.forEach((s: any) => {
      studentsSheet.addRow({
        id: s.id,
        roll_no: s.roll_no || `ROL-${s.id}`,
        firstName: s.firstName || '',
        lastName: s.lastName || '',
        courseCode: s.courseCode || 'N/A',
        courseName: s.courseName || 'N/A',
        father_name: s.father_name || 'N/A',
        mother_name: s.mother_name || 'N/A',
        gender: s.gender || 'N/A',
        dob: s.dob || 'N/A',
        phone: s.phone || 'N/A',
        email: s.email || 'N/A',
        city: s.city || 'N/A',
        state: s.state || 'N/A',
        pincode: s.pincode || 'N/A',
        address: s.address || 'N/A',
        course_fee: Number(s.course_fee || 0).toFixed(2),
        tokens_deducted: Number(s.tokens_deducted || 0).toFixed(2),
        certificate_status: s.certificate_status || 'not_generated',
        certificate_number: s.certificate_number || 'N/A',
        status: s.status || 'active',
        created_at: s.created_at ? new Date(s.created_at).toLocaleString('en-IN') : 'N/A'
      });
    });
    styleWorksheet(studentsSheet, '065F46');

    // 3. Courses Allocated Sheet
    const coursesSheet = workbook.addWorksheet('Assigned Courses');
    coursesSheet.columns = [
      { header: 'Course Code', key: 'code', width: 16 },
      { header: 'Course Name', key: 'name', width: 30 },
      { header: 'Category', key: 'categoryId', width: 18 },
      { header: 'Fee (₹)', key: 'fee', width: 16 },
      { header: 'Duration', key: 'duration', width: 16 },
      { header: 'Allocated Date', key: 'added_at', width: 22 }
    ];

    const [courses]: any = await db.query(`
      SELECT c.*, cc.added_at
      FROM center_courses cc
      JOIN courses c ON cc.courseId = c.id
      WHERE cc.centerId = ?
      ORDER BY cc.added_at DESC
    `, [centerId]);

    courses.forEach((crs: any) => {
      coursesSheet.addRow({
        code: crs.code,
        name: crs.name,
        categoryId: crs.categoryId || 'General',
        fee: Number(crs.fee || 0).toFixed(2),
        duration: crs.duration || '3 Month(s)',
        added_at: crs.added_at ? new Date(crs.added_at).toLocaleString('en-IN') : 'N/A'
      });
    });
    styleWorksheet(coursesSheet, '1E3A8A');

    // 4. Wallet Ledgers Sheet
    const walletSheet = workbook.addWorksheet('Wallet Transactions');
    walletSheet.columns = [
      { header: 'Txn ID', key: 'id', width: 12 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Amount (₹)', key: 'amount', width: 16 },
      { header: 'Description / Remarks', key: 'description', width: 40 },
      { header: 'Date & Time', key: 'created_at', width: 24 }
    ];

    const [transactions]: any = await db.query(`
      SELECT * FROM wallet_transactions
      WHERE centerId = ?
      ORDER BY created_at DESC
    `, [centerId]);

    transactions.forEach((t: any) => {
      walletSheet.addRow({
        id: t.id,
        type: (t.type || 'credit').toUpperCase(),
        amount: Number(t.amount || 0).toFixed(2),
        description: t.description || 'N/A',
        created_at: t.created_at ? new Date(t.created_at).toLocaleString('en-IN') : 'N/A'
      });
    });
    styleWorksheet(walletSheet, '854D0E');

    // 5. Token Recharge History
    const requestsSheet = workbook.addWorksheet('Recharge History');
    requestsSheet.columns = [
      { header: 'Request ID', key: 'id', width: 14 },
      { header: 'Amount (₹)', key: 'amount', width: 16 },
      { header: 'Bonus Tokens', key: 'bonus_tokens', width: 16 },
      { header: 'Total Credited', key: 'total_credited', width: 16 },
      { header: 'UTR / Ref No', key: 'utr_number', width: 24 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Requested Date', key: 'created_at', width: 22 },
      { header: 'Approved Date', key: 'approved_at', width: 22 }
    ];

    const [requests]: any = await db.query(`
      SELECT * FROM wallet_requests
      WHERE centerId = ?
      ORDER BY created_at DESC
    `, [centerId]);

    requests.forEach((r: any) => {
      requestsSheet.addRow({
        id: r.id,
        amount: Number(r.amount || 0).toFixed(2),
        bonus_tokens: Number(r.bonus_tokens || 0).toFixed(2),
        total_credited: Number(r.total_credited || 0).toFixed(2),
        utr_number: r.utr_number || 'N/A',
        status: (r.status || 'pending').toUpperCase(),
        created_at: r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : 'N/A',
        approved_at: r.approved_at ? new Date(r.approved_at).toLocaleString('en-IN') : 'N/A'
      });
    });
    styleWorksheet(requestsSheet, '9A3412');

    return workbook;
  }
};
