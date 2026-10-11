const fs = require('fs');
const path = 'frontend/src/pages/admin/TestPricingSettings.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update PricingConfig interface
code = code.replace(
  'charge_per_extra_student: number;',
  'charge_per_extra_student: number;\n  instant_certificate_charge?: number;'
);

// 2. Add input to Global Rules panel
const newField = `                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Award size={16} className="text-amber-500" />
                    Instant Certificate Charge (₹)
                  </label>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    If a student has not completed all semester exams, the center can force-generate an "Instant Certificate". This amount will be deducted directly from their wallet.
                  </p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={configForm.instant_certificate_charge || 200}
                      onChange={(e) => handleFormChange('instant_certificate_charge', parseInt(e.target.value) || 0)}
                      className="w-full pl-9 px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

              </div>`;

code = code.replace(
  '              </div>',
  newField
);

fs.writeFileSync(path, code);
