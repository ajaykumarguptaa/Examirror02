const fs = require('fs');
const path = 'frontend/src/pages/center/StudentsList.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add state for the charge
code = code.replace(
  'const [modalType, setModalType]',
  `const [instantCharge, setInstantCharge] = useState(200);
  const [modalType, setModalType]`
);

// 2. Fetch the charge inside useEffect
code = code.replace(
  'fetchStudents();',
  `fetchStudents();
    axios.get('http://localhost:3000/api/center/settings/certificate-charge').then(res => {
      if (res.data.success) setInstantCharge(res.data.charge);
    }).catch(() => {});`
);

// 3. Update the text in the modal
code = code.replace(
  /Instant Certificate will deduct ₹50/g,
  `Instant Certificate will deduct ₹\${instantCharge}`
);

code = code.replace(
  /Charges: ₹50/g,
  `Charges: ₹{instantCharge}`
);

fs.writeFileSync(path, code);
