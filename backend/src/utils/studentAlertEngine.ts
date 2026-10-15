import db from '../db';
import { notificationService } from '../services/notification.service';

export interface AdmissionAlertParams {
  phone?: string;
  studentName: string;
  enrollmentNo: string;
  rollNo: string;
  courseName?: string;
  centerId?: number | string;
  studentId?: number | string;
}

export interface CertificateAlertParams {
  studentId: number | string;
  certificateNumber: string;
  centerId?: number | string;
}

/**
 * Dispatch automated SMS / WhatsApp webhook or simulated log
 */
async function triggerExternalMessaging(phone: string, message: string, payload: any) {
  const webhookUrl = process.env.WHATSAPP_API_URL || process.env.SMS_API_URL || process.env.ALERT_WEBHOOK_URL;
  const apiKey = process.env.SMS_API_KEY || process.env.WHATSAPP_API_KEY;

  if (webhookUrl) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipient: phone,
          message,
          ...payload
        })
      });
      console.log(`[StudentAlert] Successfully dispatched real-time alert to ${phone}`);
    } catch (netErr: any) {
      console.warn(`[StudentAlert] External messaging webhook unreachable:`, netErr.message);
    }
  } else {
    // Graceful simulated dispatcher for development/staging
    console.log(`[StudentAlert:Simulated] 📲 To: ${phone} | Msg: ${message}`);
  }
}

/**
 * Send automated Admission Confirmation alert to student
 */
export async function sendStudentAdmissionAlert(params: AdmissionAlertParams): Promise<void> {
  try {
    const cleanPhone = (params.phone || '').replace(/[^0-9]/g, '');
    const verifyUrl = `https://examirror.com/verify/student/${params.rollNo || params.enrollmentNo}`;
    
    const message = `Welcome ${params.studentName}! Your admission for ${params.courseName || 'Computer Course'} is confirmed. Roll No: ${params.rollNo}, Enrollment: ${params.enrollmentNo}. Verify your credentials online: ${verifyUrl}`;

    // 1. Send SMS / WhatsApp trigger
    if (cleanPhone && cleanPhone.length >= 10) {
      await triggerExternalMessaging(cleanPhone, message, {
        type: 'admission_confirmed',
        studentName: params.studentName,
        rollNo: params.rollNo,
        enrollmentNo: params.enrollmentNo,
        verifyUrl
      });
    }

    // 2. Add in-app notification if studentId is present
    if (params.studentId) {
      await notificationService.createNotification(
        'student',
        Number(params.studentId),
        'Admission Confirmed!',
        `Your registration for ${params.courseName || 'Course'} is active. Roll No: ${params.rollNo}.`,
        'success'
      ).catch(() => {});
    }
  } catch (err: any) {
    console.error('[StudentAlert] Failed to process admission alert:', err.message);
  }
}

/**
 * Send automated Certificate Issued alert with verification QR link
 */
export async function sendStudentCertificateAlert(params: CertificateAlertParams): Promise<void> {
  try {
    const [rows]: any = await db.query(
      `SELECT s.id, s.firstName, s.lastName, s.phone, s.roll_no, c.name as course_name
       FROM students s
       LEFT JOIN courses c ON s.courseId = c.id
       WHERE s.id = ?`,
      [params.studentId]
    );

    if (!rows || rows.length === 0) return;
    const student = rows[0];
    const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
    const cleanPhone = (student.phone || '').replace(/[^0-9]/g, '');
    const verifyUrl = `https://examirror.com/verify/certificate/${params.certificateNumber}`;

    const message = `Congratulations ${studentName}! Your official Diploma/Certificate (${student.course_name || 'Course'}) has been issued. Certificate No: ${params.certificateNumber}. Verify online: ${verifyUrl}`;

    // 1. Send SMS / WhatsApp trigger
    if (cleanPhone && cleanPhone.length >= 10) {
      await triggerExternalMessaging(cleanPhone, message, {
        type: 'certificate_issued',
        studentName,
        certificateNumber: params.certificateNumber,
        verifyUrl
      });
    }

    // 2. Add in-app notification
    await notificationService.createNotification(
      'student',
      Number(params.studentId),
      'Official Certificate Issued!',
      `Your Certificate (Sl. No: ${params.certificateNumber}) is ready for download & verification.`,
      'success'
    ).catch(() => {});
  } catch (err: any) {
    console.error('[StudentAlert] Failed to process certificate alert:', err.message);
  }
}
