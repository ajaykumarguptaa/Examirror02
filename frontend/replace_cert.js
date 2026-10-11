const fs = require('fs');
const filePath = '/Users/ajaygupta/Desktop/e2/frontend/src/components/StudentCertificateModal.tsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('id="printable-certificate"'));
// Find the end div of printable-certificate
let endIdx = -1;
let openDivs = 0;
for(let i = startIdx; i < lines.length; i++) {
  const line = lines[i];
  if(line.includes('<div')) openDivs += (line.match(/<div/g) || []).length;
  if(line.includes('</div')) openDivs -= (line.match(/<\/div/g) || []).length;
  if(openDivs === 0 && line.includes('</div>')) {
    endIdx = i;
    break;
  }
}

const replacement = `          <div 
            id="printable-certificate"
            className="w-full max-w-[960px] relative font-serif select-none border border-gray-200 shadow-sm"
            style={{ aspectRatio: '1024/723', overflow: 'hidden' }}
          >
            {/* Background Template */}
            <img 
              src="/certificate-template.png" 
              alt="Certificate Background" 
              className="absolute inset-0 w-full h-full object-cover z-0" 
            />

            {/* Foreground Dynamic Text */}
            <div className="absolute inset-0 z-10 font-bold text-slate-800 text-sm sm:text-base md:text-lg">
              {/* Sl. No. */}
              <div className="absolute font-mono text-sm" style={{ top: '13.5%', left: '79%' }}>
                {slNo}
              </div>
              
              {/* Reg. No. */}
              <div className="absolute font-mono text-sm" style={{ top: '18.5%', left: '79%' }}>
                {regNo}
              </div>

              {/* Student Name */}
              <div className="absolute font-black tracking-wide uppercase text-slate-900" style={{ top: '48.3%', left: '37%' }}>
                {activeStudent.firstName} {activeStudent.lastName}
              </div>

              {/* Father Name */}
              <div className="absolute uppercase" style={{ top: '53.1%', left: '26%' }}>
                {activeStudent.fatherName || '__________________'}
              </div>

              {/* Course Name */}
              <div className="absolute uppercase" style={{ top: '57%', left: '46%' }}>
                {activeStudent.courseName || '__________________'}
              </div>

              {/* Study Centre */}
              <div className="absolute uppercase" style={{ top: '61%', left: '33%' }}>
                {centerName}
              </div>

              {/* Centre Code */}
              <div className="absolute font-mono" style={{ top: '65.2%', left: '24%' }}>
                {centerCode}
              </div>

              {/* Duration */}
              <div className="absolute uppercase" style={{ top: '65.2%', left: '55%' }}>
                {activeStudent.duration || activeStudent.courseDuration || '3 MONTHS'}
              </div>

              {/* In (Session) */}
              <div className="absolute uppercase" style={{ top: '65.2%', left: '73%' }}>
                {sessionText}
              </div>

              {/* Grade */}
              <div className="absolute font-black text-lg text-emerald-800" style={{ top: '69%', left: '37%' }}>
                {calculatedGrade}
              </div>

              {/* Date of Issue */}
              <div className="absolute" style={{ top: '75.2%', left: '28%' }}>
                {issueDate}
              </div>
            </div>
          </div>`;

if(startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx - 1, endIdx - startIdx + 2, replacement);
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Successfully replaced certificate code');
} else {
  console.log('Could not find start or end index', startIdx, endIdx);
}
