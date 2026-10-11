const fs = require('fs');
const path = 'frontend/src/pages/admin/AdminStudents.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add studentMarks state
code = code.replace(
  'const [viewingStudent, setViewingStudent] = useState<StudentData | null>(null);',
  `const [viewingStudent, setViewingStudent] = useState<StudentData | null>(null);
  const [studentMarks, setStudentMarks] = useState<any[]>([]);`
);

// 2. Add useEffect to fetch marks when viewingStudent changes
code = code.replace(
  'const fetchStudents = async () => {',
  `useEffect(() => {
    if (viewingStudent) {
      axios.get(\`http://localhost:3000/api/admin/students/\${viewingStudent.id}/marks\`)
        .then(res => {
          if(res.data.success) setStudentMarks(res.data.marks);
        }).catch(err => setStudentMarks([]));
    } else {
      setStudentMarks([]);
    }
  }, [viewingStudent]);
  
  const fetchStudents = async () => {`
);

// 3. Add UI for Detailed Scorecard in the modal
const marksUI = `</div>

              {/* DETAILED SCORECARD FOR SUPER ADMIN */}
              <div className="mt-6 border-t pt-4">
                <h4 className="font-bold text-sm text-indigo-900 mb-3 flex items-center gap-2">
                  <FileText size={16} /> Detailed Scorecard (Exam Analytics)
                </h4>
                {studentMarks.length === 0 ? (
                  <p className="text-gray-500 italic text-xs">No exams scheduled or attempted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {studentMarks.map((m, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-indigo-700">{m.semester}</span>
                          <span className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase \${m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}\`}>
                            {m.status || 'Pending'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-white p-2 border border-slate-200 rounded">
                            <span className="block text-slate-500 font-bold mb-1">Written Marks</span>
                            <span className="text-lg font-black text-slate-800">{m.written_marks || 0}</span>
                          </div>
                          <div className="bg-white p-2 border border-slate-200 rounded">
                            <span className="block text-slate-500 font-bold mb-1">Viva Marks (Center)</span>
                            <span className="text-lg font-black text-slate-800">{m.viva_marks || 0}</span>
                          </div>
                          <div className="bg-white p-2 border border-slate-200 rounded">
                            <span className="block text-slate-500 font-bold mb-1">Re-attempts</span>
                            <span className="text-lg font-black text-red-600">{m.reattempts || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
`;

code = code.replace(
  '<div className="col-span-2"><strong>Address:</strong> {viewingStudent.address}, {viewingStudent.city}, {viewingStudent.state} - {viewingStudent.pincode}</div>\n              </div>',
  '<div className="col-span-2"><strong>Address:</strong> {viewingStudent.address}, {viewingStudent.city}, {viewingStudent.state} - {viewingStudent.pincode}</div>\n              </div>' + marksUI
);

fs.writeFileSync(path, code);
