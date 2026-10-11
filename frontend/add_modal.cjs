const fs = require('fs');
const path = 'frontend/src/pages/center/AddStudent.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add state for the success modal
code = code.replace(
  "const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);",
  "const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);\n  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string; enrollNo?: string }>({ show: false, message: '' });"
);

// 2. Change submit logic to trigger modal instead of inline feedback
code = code.replace(
  "setFeedback({\n          type: 'success',\n          text: `Student ${fullName} registered successfully! ₹${requiredTokens} Tokens deducted from wallet.`\n        });",
  "setSuccessModal({\n          show: true,\n          message: `Student ${fullName} registered successfully! ₹${requiredTokens} Tokens deducted from wallet.`,\n          enrollNo: res.data.enrollment_no || ''\n        });\n        setFeedback(null);"
);

// 3. Import CheckCircle (if not already imported)
if (!code.includes('CheckCircle,')) {
  code = code.replace(
    'import { AlertCircle, Upload, X, Save, IndianRupee } from \'lucide-react\';',
    'import { AlertCircle, Upload, X, Save, IndianRupee, CheckCircle, ExternalLink } from \'lucide-react\';'
  );
}

// 4. Inject Modal JSX at the end of the component
const modalJSX = `
      {/* Success Modal Popup */}
      {successModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden scale-in-center">
            <div className="bg-emerald-50 p-6 flex flex-col items-center text-center border-b border-emerald-100">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <CheckCircle size={40} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black text-emerald-900 mb-2">Registration Successful!</h3>
              <p className="text-emerald-700 font-medium text-sm leading-relaxed">
                {successModal.message}
              </p>
            </div>
            
            <div className="p-6 bg-white space-y-4 text-center">
              {successModal.enrollNo && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Student Enrollment No</p>
                  <p className="text-xl font-mono font-black text-indigo-700 select-all">{successModal.enrollNo}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.location.href = '/center/students'}
                  className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-700 text-slate-700 font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  <ExternalLink size={18} /> View Students
                </button>
                <button
                  type="button"
                  onClick={() => setSuccessModal({ show: false, message: '' })}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-colors"
                >
                  Add Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`;

code = code.replace(
  /    <\/div>\n  \);\n};\n\nexport default AddStudent;/g,
  modalJSX + '\n\nexport default AddStudent;'
);

fs.writeFileSync(path, code);
