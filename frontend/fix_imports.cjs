const fs = require('fs');
const path = 'frontend/src/pages/center/AddStudent.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "import { Send, ChevronDown, CheckCircle2, AlertCircle, User, Camera, FileCheck2 } from 'lucide-react';",
  "import { Send, ChevronDown, CheckCircle2, AlertCircle, User, Camera, FileCheck2, CheckCircle, ExternalLink } from 'lucide-react';"
);

fs.writeFileSync(path, code);
