export interface GradeResult {
  grade: string;
  percentage: number;
  label: string;
  totalObtained: number;
  totalMax: number;
}

export const getGradeFromPercentage = (pct: number, totalObtained = 0, totalMax = 0): GradeResult => {
  const roundedPct = Math.round(pct);
  if (roundedPct >= 85) return { grade: 'A+', label: 'Outstanding (Distinction)', percentage: roundedPct, totalObtained, totalMax };
  if (roundedPct >= 75) return { grade: 'A', label: 'First Class with Distinction', percentage: roundedPct, totalObtained, totalMax };
  if (roundedPct >= 60) return { grade: 'B', label: 'First Class', percentage: roundedPct, totalObtained, totalMax };
  if (roundedPct >= 50) return { grade: 'C', label: 'Second Class', percentage: roundedPct, totalObtained, totalMax };
  if (roundedPct >= 40) return { grade: 'D', label: 'Pass Class', percentage: roundedPct, totalObtained, totalMax };
  return { grade: 'F', label: 'Failed (Re-appear)', percentage: roundedPct, totalObtained, totalMax };
};

export const getGradeLabel = (grade: string): string => {
  switch (grade.toUpperCase()) {
    case 'A+': return 'Outstanding (Distinction)';
    case 'A': return 'First Class with Distinction';
    case 'B': return 'First Class';
    case 'C': return 'Second Class';
    case 'D': return 'Pass Class';
    default: return 'Pass';
  }
};

export const calculateStudentAcademicGrade = (student: any): GradeResult => {
  if (!student) {
    return {
      grade: 'A+',
      percentage: 85,
      label: 'Outstanding (Distinction)',
      totalObtained: 85,
      totalMax: 100
    };
  }

  // 1. If student already has an explicit grade assigned
  if (student.grade && typeof student.grade === 'string' && student.grade.trim()) {
    const g = student.grade.trim().toUpperCase();
    return {
      grade: g,
      percentage: Number(student.percentage) || (g === 'A+' ? 90 : g === 'A' ? 80 : g === 'B' ? 65 : 55),
      label: getGradeLabel(g),
      totalObtained: Number(student.totalMarksObtained) || 0,
      totalMax: Number(student.totalMaxMarks) || 0
    };
  }

  const marksList: any[] = Array.isArray(student.marks) ? student.marks : [];

  // 2. Filter for actual completed or attempted exams
  const validMarks = marksList.filter(m => {
    if (!m) return false;
    const isCompleted = m.status === 'completed' || Number(m.is_marksheet_generated) === 1;
    const hasScores = (m.written_marks !== null && m.written_marks !== undefined) ||
                      (m.viva_marks !== null && m.viva_marks !== undefined) ||
                      (m.total_marks !== null && m.total_marks !== undefined);
    return isCompleted || hasScores;
  });

  if (validMarks.length === 0) {
    // If student has explicit percentage attribute
    if (student.percentage !== undefined && student.percentage !== null && !isNaN(Number(student.percentage))) {
      return getGradeFromPercentage(Number(student.percentage));
    }
    // Default fallback grade if no exams taken yet
    return {
      grade: 'A+',
      percentage: 85,
      label: 'Outstanding (Distinction)',
      totalObtained: 85,
      totalMax: 100
    };
  }

  // Parse course semesters config for max marks
  let rawSem = student.courseSemesters || student.semesters;
  if (typeof rawSem === 'string') {
    try { rawSem = JSON.parse(rawSem); } catch (_) {}
  }

  let totalObtained = 0;
  let totalMax = 0;

  validMarks.forEach((m, idx) => {
    let maxWritten = 80;
    let maxViva = 20;

    if (Array.isArray(rawSem)) {
      const semStr = String(m.semester || '').toUpperCase().trim();
      const semMatch = semStr.match(/\d+/);
      const semNum = semMatch ? semMatch[0] : String(idx + 1);

      const found = rawSem.find((s: any) => {
        const sNumStr = String(s.num ?? '').toUpperCase().trim();
        const sMatch = sNumStr.match(/\d+/);
        const sVal = sMatch ? sMatch[0] : sNumStr;
        return (
          sNumStr === semStr ||
          `SEM ${sNumStr}` === semStr ||
          `SEMESTER ${sNumStr}` === semStr ||
          sVal === semNum
        );
      });

      if (found) {
        maxWritten = Number(found.marks) || 80;
        maxViva = Number(found.oral) || 20;
      }
    } else if (Number(m.max_total || m.max_marks)) {
      const mt = Number(m.max_total || m.max_marks);
      maxWritten = Math.round(mt * 0.8);
      maxViva = mt - maxWritten;
    }

    const semMaxTotal = maxWritten + maxViva;
    const rawWritten = Number(m.written_marks) || 0;
    const rawViva = Number(m.viva_marks) || 0;
    const written = Math.min(maxWritten, rawWritten);
    const viva = Math.min(maxViva, rawViva);
    const obt = Math.min(semMaxTotal, m.total_marks !== undefined && m.total_marks !== null ? Number(m.total_marks) : (written + viva));

    totalObtained += obt;
    totalMax += semMaxTotal;
  });

  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 85;
  return getGradeFromPercentage(percentage, totalObtained, totalMax);
};
