const fs = require('fs');
const path = 'frontend/src/pages/admin/TestPricingSettings.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add state variable
code = code.replace(
  'const [description, setDescription] = useState<string>(\'\');',
  'const [description, setDescription] = useState<string>(\'\');\n  const [instantCertificateCharge, setInstantCertificateCharge] = useState<number>(200);'
);

// 2. Add to fetchPricingData
code = code.replace(
  'setChargePerExtraStudent(payload.config.charge_per_extra_student);',
  'setChargePerExtraStudent(payload.config.charge_per_extra_student);\n        if (payload.config.instant_certificate_charge !== undefined) setInstantCertificateCharge(payload.config.instant_certificate_charge);'
);

// 3. Add to handleSaveConfig payload
code = code.replace(
  'charge_per_extra_student: chargePerExtraStudent',
  'charge_per_extra_student: chargePerExtraStudent,\n        instant_certificate_charge: instantCertificateCharge'
);

// 4. Update the JSX
const oldJSX = `value={configForm.instant_certificate_charge || 200}
                      onChange={(e) => handleFormChange('instant_certificate_charge', parseInt(e.target.value) || 0)}`;

const newJSX = `value={instantCertificateCharge}
                      onChange={(e) => setInstantCertificateCharge(parseInt(e.target.value) || 0)}`;

code = code.replace(oldJSX, newJSX);

fs.writeFileSync(path, code);
