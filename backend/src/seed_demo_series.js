const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'e2_db'
  });

  // Remove partial series from previous failed run if any
  await pool.query("DELETE FROM test_series WHERE slug LIKE 'fullstack-web-dev-js-%' OR slug LIKE 'ibps-po-sbi-bank-mega-%' OR slug LIKE 'railway-rrb-ntpc-science-%' OR slug LIKE 'tally-prime-gst-mock-%' OR slug LIKE 'logical-reasoning-speed-drill-%'");

  const seriesData = [
    {
      title: 'Full-Stack Web Development & JavaScript Mastery',
      slug: 'fullstack-web-dev-js-' + Date.now(),
      category_id: 1,
      description: 'Comprehensive assessment covering modern JavaScript ES6+, DOM manipulation, HTML5 APIs, CSS Flexbox/Grid, and web app architecture.',
      thumbnail_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
      instructions: '• 5 questions per test\n• Each question carries 4 marks with 1 mark negative marking\n• Time limit is strictly enforced',
      exam_type: 'Technical Skill Certification',
      language: 'English',
      difficulty: 'INTERMEDIATE',
      total_tests: 2,
      price: 0.00,
      is_free: 1,
      duration_minutes: 45,
      validity_days: 180,
      publish_scope: 'ALL_CENTRES',
      payment_qr_id: 1,
      status: 'PUBLISHED',
      tests: [
        {
          title: 'JavaScript Core & ES6 Features Mock',
          description: 'Test your understanding of Promises, Async/Await, Closures, Scoping, and Array Methods.',
          duration_minutes: 20,
          total_marks: 20,
          negative_marks: 1.0,
          passing_marks: 8,
          questions: [
            {
              text: 'Which of the following methods creates a new array with all elements that pass the test implemented by the provided function?',
              section: 'Array Methods',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1,
              explanation: 'Array.prototype.filter() creates a shallow copy of a portion of a given array, filtered down to just the elements from the given array that pass the test.',
              options: [
                { key: 'A', text: 'forEach()', is_correct: 0 },
                { key: 'B', text: 'filter()', is_correct: 1 },
                { key: 'C', text: 'map()', is_correct: 0 },
                { key: 'D', text: 'reduce()', is_correct: 0 }
              ]
            },
            {
              text: 'What will be the output of typeof NaN in JavaScript?',
              section: 'Core Types',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1,
              explanation: 'In JavaScript, NaN (Not-a-Number) is a special numeric value, so typeof NaN returns "number".',
              options: [
                { key: 'A', text: '"undefined"', is_correct: 0 },
                { key: 'B', text: '"nan"', is_correct: 0 },
                { key: 'C', text: '"number"', is_correct: 1 },
                { key: 'D', text: '"object"', is_correct: 0 }
              ]
            },
            {
              text: 'Which keyword is used to declare a block-scoped variable that cannot be reassigned?',
              section: 'ES6 Syntax',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1,
              explanation: 'const creates a block-scoped read-only constant reference.',
              options: [
                { key: 'A', text: 'var', is_correct: 0 },
                { key: 'B', text: 'let', is_correct: 0 },
                { key: 'C', text: 'const', is_correct: 1 },
                { key: 'D', text: 'static', is_correct: 0 }
              ]
            },
            {
              text: 'How do you check if a property exists in an object in modern JavaScript?',
              section: 'Objects',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1,
              explanation: 'The "in" operator (e.g. "prop" in obj) or Object.hasOwn(obj, "prop") checks for property existence.',
              options: [
                { key: 'A', text: 'prop in obj', is_correct: 1 },
                { key: 'B', text: 'obj.has(prop)', is_correct: 0 },
                { key: 'C', text: 'obj.exists(prop)', is_correct: 0 },
                { key: 'D', text: 'prop.inside(obj)', is_correct: 0 }
              ]
            },
            {
              text: 'What state is a Promise in initially before resolution or rejection?',
              section: 'Asynchronous JS',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1,
              explanation: 'A Promise is initially in the "pending" state before transitioning to "fulfilled" or "rejected".',
              options: [
                { key: 'A', text: 'fulfilled', is_correct: 0 },
                { key: 'B', text: 'pending', is_correct: 1 },
                { key: 'C', text: 'resolved', is_correct: 0 },
                { key: 'D', text: 'waiting', is_correct: 0 }
              ]
            }
          ]
        },
        {
          title: 'HTML5 Semantic Elements & CSS Layouts',
          description: 'Assess modern CSS Grid, Flexbox alignment, and HTML5 semantic structure.',
          duration_minutes: 25,
          total_marks: 20,
          negative_marks: 1.0,
          passing_marks: 8,
          questions: [
            {
              text: 'Which CSS property defines the main-axis alignment for Flexbox items?',
              section: 'CSS Flexbox',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1,
              explanation: 'justify-content aligns items along the main axis, while align-items aligns along the cross axis.',
              options: [
                { key: 'A', text: 'align-items', is_correct: 0 },
                { key: 'B', text: 'justify-content', is_correct: 1 },
                { key: 'C', text: 'align-content', is_correct: 0 },
                { key: 'D', text: 'place-items', is_correct: 0 }
              ]
            },
            {
              text: 'Which HTML5 element represents standalone, self-contained content such as a blog post or news story?',
              section: 'HTML5 Semantics',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1,
              explanation: '<article> is intended for independent, self-contained content reusable across syndicated formats.',
              options: [
                { key: 'A', text: '<section>', is_correct: 0 },
                { key: 'B', text: '<aside>', is_correct: 0 },
                { key: 'C', text: '<article>', is_correct: 1 },
                { key: 'D', text: '<main>', is_correct: 0 }
              ]
            },
            {
              text: 'What does CSS box-sizing: border-box do?',
              section: 'Box Model',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1,
              explanation: 'border-box includes padding and border in the element\'s total specified width and height.',
              options: [
                { key: 'A', text: 'Includes padding and border in total width and height', is_correct: 1 },
                { key: 'B', text: 'Excludes padding from total dimensions', is_correct: 0 },
                { key: 'C', text: 'Forces element to be an inline box', is_correct: 0 },
                { key: 'D', text: 'Removes the margin around an element', is_correct: 0 }
              ]
            },
            {
              text: 'Which unit is relative to the font-size of the root (<html>) element?',
              section: 'CSS Units',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1,
              explanation: 'rem stands for Root EM and scales relative to the root html font-size.',
              options: [
                { key: 'A', text: 'em', is_correct: 0 },
                { key: 'B', text: 'rem', is_correct: 1 },
                { key: 'C', text: 'vh', is_correct: 0 },
                { key: 'D', text: '%', is_correct: 0 }
              ]
            },
            {
              text: 'Which attribute in an <input> element specifies a regular expression pattern to validate user input?',
              section: 'HTML Forms',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1,
              explanation: 'The pattern attribute takes a regex string that the input\'s value must match.',
              options: [
                { key: 'A', text: 'regex', is_correct: 0 },
                { key: 'B', text: 'validate', is_correct: 0 },
                { key: 'C', text: 'pattern', is_correct: 1 },
                { key: 'D', text: 'match', is_correct: 0 }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'IBPS PO & SBI Bank Specialist Mega Test Series 2026',
      slug: 'ibps-po-sbi-bank-mega-' + Date.now(),
      category_id: 3,
      description: 'High-yield mock series for Banking aspirants covering Quantitative Aptitude, Banking Regulations, RBI monetary policies, and Financial reasoning.',
      thumbnail_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
      instructions: '• Official IBPS Pattern\n• 5 marks per correct answer with 1.25 negative marks\n• Instant scorecard with all-India percentile',
      exam_type: 'Banking & Financial Services',
      language: 'English + Hindi',
      difficulty: 'ADVANCED',
      total_tests: 2,
      price: 199.00,
      is_free: 0,
      duration_minutes: 60,
      validity_days: 90,
      publish_scope: 'ALL_CENTRES',
      payment_qr_id: 1,
      status: 'PUBLISHED',
      tests: [
        {
          title: 'Quantitative Aptitude & Speed Calculation Mock 1',
          description: 'Focuses on Data Interpretation, Compound Interest, Time & Work, and Quadratic Equations.',
          duration_minutes: 30,
          total_marks: 25,
          negative_marks: 1.25,
          passing_marks: 12,
          questions: [
            {
              text: 'A sum of money doubles itself at compound interest in 15 years. In how many years will it become 8 times of itself at the same rate?',
              section: 'Compound Interest',
              type: 'SINGLE_CHOICE',
              marks: 5,
              negative: 1.25,
              explanation: '8 = 2^3. Therefore, time required = 3 * 15 = 45 years.',
              options: [
                { key: 'A', text: '30 Years', is_correct: 0 },
                { key: 'B', text: '40 Years', is_correct: 0 },
                { key: 'C', text: '45 Years', is_correct: 1 },
                { key: 'D', text: '60 Years', is_correct: 0 }
              ]
            },
            {
              text: 'If A can complete a work in 12 days and B in 18 days, working together in how many days will they finish the entire work?',
              section: 'Time and Work',
              type: 'SINGLE_CHOICE',
              marks: 5,
              negative: 1.25,
              explanation: '1/12 + 1/18 = (3 + 2)/36 = 5/36. Days = 36/5 = 7.2 days (7 1/5 days).',
              options: [
                { key: 'A', text: '7.2 Days', is_correct: 1 },
                { key: 'B', text: '6.5 Days', is_correct: 0 },
                { key: 'C', text: '8.0 Days', is_correct: 0 },
                { key: 'D', text: '7.5 Days', is_correct: 0 }
              ]
            },
            {
              text: 'Find the roots of the quadratic equation: x^2 - 13x + 40 = 0.',
              section: 'Algebra',
              type: 'SINGLE_CHOICE',
              marks: 5,
              negative: 1.25,
              explanation: '(x - 5)(x - 8) = 0 => x = 5, 8.',
              options: [
                { key: 'A', text: '5 and 8', is_correct: 1 },
                { key: 'B', text: '-5 and -8', is_correct: 0 },
                { key: 'C', text: '4 and 10', is_correct: 0 },
                { key: 'D', text: '3 and 10', is_correct: 0 }
              ]
            },
            {
              text: 'A shopkeeper marks an article 25% above cost price and allows a discount of 10%. What is his overall profit percentage?',
              section: 'Profit and Loss',
              type: 'SINGLE_CHOICE',
              marks: 5,
              negative: 1.25,
              explanation: 'SP = 100 * 1.25 * 0.90 = 112.5. Profit % = 12.5%.',
              options: [
                { key: 'A', text: '10.5%', is_correct: 0 },
                { key: 'B', text: '12.5%', is_correct: 1 },
                { key: 'C', text: '15.0%', is_correct: 0 },
                { key: 'D', text: '14.2%', is_correct: 0 }
              ]
            },
            {
              text: 'What is the average of first 10 consecutive odd natural numbers?',
              section: 'Number System',
              type: 'SINGLE_CHOICE',
              marks: 5,
              negative: 1.25,
              explanation: 'Average of first n odd natural numbers is always equal to n. Here n = 10.',
              options: [
                { key: 'A', text: '10', is_correct: 1 },
                { key: 'B', text: '11', is_correct: 0 },
                { key: 'C', text: '10.5', is_correct: 0 },
                { key: 'D', text: '9.5', is_correct: 0 }
              ]
            }
          ]
        },
        {
          title: 'Banking & Financial Awareness Mock 2',
          description: 'RBI policies, Repo rate, CRR, SLR, Basel III norms, and Financial inclusion schemes.',
          duration_minutes: 30,
          total_marks: 25,
          negative_marks: 1.25,
          passing_marks: 12,
          questions: [
            {
              text: 'What does CRR stand for in Banking and Central Monetary policy?',
              section: 'Banking Terms',
              type: 'SINGLE_CHOICE',
              marks: 5,
              negative: 1.25,
              explanation: 'Cash Reserve Ratio (CRR) is the percentage of a bank\'s total deposits that must be maintained with the Reserve Bank of India.',
              options: [
                { key: 'A', text: 'Cash Reserve Ratio', is_correct: 1 },
                { key: 'B', text: 'Credit Recovery Ratio', is_correct: 0 },
                { key: 'C', text: 'Central Reserve Requirement', is_correct: 0 },
                { key: 'D', text: 'Capital Risk Ratio', is_correct: 0 }
              ]
            },
            {
              text: 'Which institution serves as the lender of last resort in India\'s financial system?',
              section: 'Regulatory Bodies',
              type: 'SINGLE_CHOICE',
              marks: 5,
              negative: 1.25,
              explanation: 'The Reserve Bank of India (RBI) is the central bank and acts as the lender of last resort.',
              options: [
                { key: 'A', text: 'State Bank of India (SBI)', is_correct: 0 },
                { key: 'B', text: 'Reserve Bank of India (RBI)', is_correct: 1 },
                { key: 'C', text: 'SEBI', is_correct: 0 },
                { key: 'D', text: 'NABARD', is_correct: 0 }
              ]
            },
            {
              text: 'What is the maximum insurance coverage provided by DICGC per depositor per insured bank in India?',
              section: 'Deposit Insurance',
              type: 'SINGLE_CHOICE',
              marks: 5,
              negative: 1.25,
              explanation: 'DICGC insures principal and interest up to a maximum limit of ₹5 Lakh per depositor.',
              options: [
                { key: 'A', text: '₹1 Lakh', is_correct: 0 },
                { key: 'B', text: '₹2 Lakh', is_correct: 0 },
                { key: 'C', text: '₹5 Lakh', is_correct: 1 },
                { key: 'D', text: '₹10 Lakh', is_correct: 0 }
              ]
            },
            {
              text: 'Which apex financial institution in India specializes in agriculture and rural development financing?',
              section: 'Rural Banking',
              type: 'SINGLE_CHOICE',
              marks: 5,
              negative: 1.25,
              explanation: 'NABARD (National Bank for Agriculture and Rural Development) is the apex development bank for rural sectors.',
              options: [
                { key: 'A', text: 'SIDBI', is_correct: 0 },
                { key: 'B', text: 'EXIM Bank', is_correct: 0 },
                { key: 'C', text: 'NABARD', is_correct: 1 },
                { key: 'D', text: 'NHB', is_correct: 0 }
              ]
            },
            {
              text: 'How many digits are present in an Indian Financial System Code (IFSC)?',
              section: 'Payment Systems',
              type: 'SINGLE_CHOICE',
              marks: 5,
              negative: 1.25,
              explanation: 'IFSC is an 11-character alphanumeric code used to identify bank branches participating in online fund transfers.',
              options: [
                { key: 'A', text: '10', is_correct: 0 },
                { key: 'B', text: '11', is_correct: 1 },
                { key: 'C', text: '12', is_correct: 0 },
                { key: 'D', text: '16', is_correct: 0 }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Railway RRB NTPC & Group D General Science & Math Pack',
      slug: 'railway-rrb-ntpc-science-' + Date.now(),
      category_id: 4,
      description: 'Exam-oriented test pack for Railway Recruitment Board covering Physics laws, Organic/Inorganic Chemistry, Human Biology, and General Arithmetic.',
      thumbnail_url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=800',
      instructions: '• RRB NTPC Pattern\n• 3 marks for correct answer, 1 mark deduction for incorrect\n• Auto-calculates sectional accuracy',
      exam_type: 'Government Railway Exam',
      language: 'English + Hindi',
      difficulty: 'INTERMEDIATE',
      total_tests: 2,
      price: 149.00,
      is_free: 0,
      duration_minutes: 60,
      validity_days: 120,
      publish_scope: 'ALL_CENTRES',
      payment_qr_id: 1,
      status: 'PUBLISHED',
      tests: [
        {
          title: 'General Science (Physics, Chemistry & Biology) Drill',
          description: 'Basic NCERT 10th standard science questions commonly asked in RRB papers.',
          duration_minutes: 30,
          total_marks: 15,
          negative_marks: 1.0,
          passing_marks: 6,
          questions: [
            {
              text: 'What is the SI unit of Electric Current?',
              section: 'Physics',
              type: 'SINGLE_CHOICE',
              marks: 3,
              negative: 1.0,
              explanation: 'The SI unit of electric current is Ampere (A). Volt is for potential difference, Ohm for resistance, Watt for power.',
              options: [
                { key: 'A', text: 'Volt', is_correct: 0 },
                { key: 'B', text: 'Ampere', is_correct: 1 },
                { key: 'C', text: 'Ohm', is_correct: 0 },
                { key: 'D', text: 'Watt', is_correct: 0 }
              ]
            },
            {
              text: 'Which gas is known as Laughing Gas?',
              section: 'Chemistry',
              type: 'SINGLE_CHOICE',
              marks: 3,
              negative: 1.0,
              explanation: 'Nitrous Oxide (N2O) is commonly known as laughing gas.',
              options: [
                { key: 'A', text: 'Nitrous Oxide (N2O)', is_correct: 1 },
                { key: 'B', text: 'Nitric Oxide (NO)', is_correct: 0 },
                { key: 'C', text: 'Nitrogen Dioxide (NO2)', is_correct: 0 },
                { key: 'D', text: 'Sulfur Dioxide (SO2)', is_correct: 0 }
              ]
            },
            {
              text: 'Which organelle is universally referred to as the Powerhouse of the Cell?',
              section: 'Biology',
              type: 'SINGLE_CHOICE',
              marks: 3,
              negative: 1.0,
              explanation: 'Mitochondria produce ATP through cellular respiration, earning the moniker Powerhouse of the Cell.',
              options: [
                { key: 'A', text: 'Ribosome', is_correct: 0 },
                { key: 'B', text: 'Golgi Apparatus', is_correct: 0 },
                { key: 'C', text: 'Mitochondria', is_correct: 1 },
                { key: 'D', text: 'Nucleus', is_correct: 0 }
              ]
            },
            {
              text: 'What is the chemical formula of common washing soda?',
              section: 'Chemistry',
              type: 'SINGLE_CHOICE',
              marks: 3,
              negative: 1.0,
              explanation: 'Washing soda is Sodium Carbonate Decahydrate (Na2CO3.10H2O), while baking soda is NaHCO3.',
              options: [
                { key: 'A', text: 'NaHCO3', is_correct: 0 },
                { key: 'B', text: 'Na2CO3.10H2O', is_correct: 1 },
                { key: 'C', text: 'NaOH', is_correct: 0 },
                { key: 'D', text: 'CaSO4.2H2O', is_correct: 0 }
              ]
            },
            {
              text: 'Sound waves cannot travel through which of the following mediums?',
              section: 'Physics',
              type: 'SINGLE_CHOICE',
              marks: 3,
              negative: 1.0,
              explanation: 'Sound is a mechanical wave requiring a physical material medium; it cannot propagate in a vacuum.',
              options: [
                { key: 'A', text: 'Water', is_correct: 0 },
                { key: 'B', text: 'Steel', is_correct: 0 },
                { key: 'C', text: 'Air', is_correct: 0 },
                { key: 'D', text: 'Vacuum', is_correct: 1 }
              ]
            }
          ]
        },
        {
          title: 'RRB NTPC Speed Math & Quantitative Practice',
          description: 'Speed, Time, Distance, Trains, Pipes & Cisterns, and Simple Interest.',
          duration_minutes: 30,
          total_marks: 15,
          negative_marks: 1.0,
          passing_marks: 6,
          questions: [
            {
              text: 'A train 150m long passes a standing pole in 15 seconds. What is the speed of the train in km/h?',
              section: 'Speed & Distance',
              type: 'SINGLE_CHOICE',
              marks: 3,
              negative: 1.0,
              explanation: 'Speed = Distance / Time = 150 / 15 = 10 m/s. In km/h = 10 * (18/5) = 36 km/h.',
              options: [
                { key: 'A', text: '30 km/h', is_correct: 0 },
                { key: 'B', text: '36 km/h', is_correct: 1 },
                { key: 'C', text: '40 km/h', is_correct: 0 },
                { key: 'D', text: '45 km/h', is_correct: 0 }
              ]
            },
            {
              text: 'What is the value of (25% of 400) + (15% of 600)?',
              section: 'Percentages',
              type: 'SINGLE_CHOICE',
              marks: 3,
              negative: 1.0,
              explanation: '(0.25 * 400) + (0.15 * 600) = 100 + 90 = 190.',
              options: [
                { key: 'A', text: '180', is_correct: 0 },
                { key: 'B', text: '190', is_correct: 1 },
                { key: 'C', text: '200', is_correct: 0 },
                { key: 'D', text: '195', is_correct: 0 }
              ]
            },
            {
              text: 'Two pipes A and B can fill a tank in 20 and 30 minutes respectively. If both pipes are opened together, how long will it take to fill the tank?',
              section: 'Pipes and Cisterns',
              type: 'SINGLE_CHOICE',
              marks: 3,
              negative: 1.0,
              explanation: '(20 * 30) / (20 + 30) = 600 / 50 = 12 minutes.',
              options: [
                { key: 'A', text: '10 Minutes', is_correct: 0 },
                { key: 'B', text: '12 Minutes', is_correct: 1 },
                { key: 'C', text: '15 Minutes', is_correct: 0 },
                { key: 'D', text: '16 Minutes', is_correct: 0 }
              ]
            },
            {
              text: 'Find the simple interest on ₹5,000 at 6% per annum for 3 years.',
              section: 'Simple Interest',
              type: 'SINGLE_CHOICE',
              marks: 3,
              negative: 1.0,
              explanation: 'SI = (P * R * T) / 100 = (5000 * 6 * 3) / 100 = ₹900.',
              options: [
                { key: 'A', text: '₹800', is_correct: 0 },
                { key: 'B', text: '₹900', is_correct: 1 },
                { key: 'C', text: '₹950', is_correct: 0 },
                { key: 'D', text: '₹1,000', is_correct: 0 }
              ]
            },
            {
              text: 'The ratio of two numbers is 3:4 and their HCF is 4. What is their LCM?',
              section: 'HCF & LCM',
              type: 'SINGLE_CHOICE',
              marks: 3,
              negative: 1.0,
              explanation: 'Numbers are 3*4=12 and 4*4=16. LCM(12, 16) = 48.',
              options: [
                { key: 'A', text: '36', is_correct: 0 },
                { key: 'B', text: '48', is_correct: 1 },
                { key: 'C', text: '64', is_correct: 0 },
                { key: 'D', text: '54', is_correct: 0 }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Tally Prime & GST Accounting Certification Mock',
      slug: 'tally-prime-gst-mock-' + Date.now(),
      category_id: 5,
      description: 'Practical certification mock test covering Double Entry Bookkeeping, Ledger Creation, Inventory Valuation, GST Invoicing, E-Way Bill, and TDS calculations in Tally Prime.',
      thumbnail_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=800',
      instructions: '• Accounting Standard Compliant\n• 4 marks per question\n• Detailed journal voucher explanations provided',
      exam_type: 'Professional Diploma Mock',
      language: 'English + Hindi',
      difficulty: 'INTERMEDIATE',
      total_tests: 2,
      price: 249.00,
      is_free: 0,
      duration_minutes: 60,
      validity_days: 90,
      publish_scope: 'ALL_CENTRES',
      payment_qr_id: 1,
      status: 'PUBLISHED',
      tests: [
        {
          title: 'Tally Prime Fundamentals & Voucher Types',
          description: 'Payment, Receipt, Contra, Journal, Sales, and Purchase vouchers with shortcut keys.',
          duration_minutes: 30,
          total_marks: 20,
          negative_marks: 1.0,
          passing_marks: 8,
          questions: [
            {
              text: 'Which function key is used to open the Contra Voucher (Fund transfers between cash and bank) in Tally Prime?',
              section: 'Vouchers',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'F4 is Contra, F5 is Payment, F6 is Receipt, F7 is Journal, F8 is Sales, F9 is Purchase.',
              options: [
                { key: 'A', text: 'F4', is_correct: 1 },
                { key: 'B', text: 'F5', is_correct: 0 },
                { key: 'C', text: 'F6', is_correct: 0 },
                { key: 'D', text: 'F7', is_correct: 0 }
              ]
            },
            {
              text: 'In which primary group should Salaries Outstanding ledger be created?',
              section: 'Ledger Groups',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Outstanding expenses are liabilities to be settled in the near term, grouped under Current Liabilities.',
              options: [
                { key: 'A', text: 'Indirect Expenses', is_correct: 0 },
                { key: 'B', text: 'Current Liabilities', is_correct: 1 },
                { key: 'C', text: 'Direct Expenses', is_correct: 0 },
                { key: 'D', text: 'Provisions', is_correct: 0 }
              ]
            },
            {
              text: 'What is the shortcut key to duplicate a voucher in Tally Prime?',
              section: 'Shortcuts',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Alt + 2 is used to duplicate any voucher entry in Tally.',
              options: [
                { key: 'A', text: 'Alt + D', is_correct: 0 },
                { key: 'B', text: 'Ctrl + D', is_correct: 0 },
                { key: 'C', text: 'Alt + 2', is_correct: 1 },
                { key: 'D', text: 'Alt + C', is_correct: 0 }
              ]
            },
            {
              text: 'Which golden rule of accounting applies to Real Accounts (e.g. Building, Machinery, Cash)?',
              section: 'Accounting Principles',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Real Account Rule: Debit what comes in, Credit what goes out.',
              options: [
                { key: 'A', text: 'Debit the receiver, Credit the giver', is_correct: 0 },
                { key: 'B', text: 'Debit what comes in, Credit what goes out', is_correct: 1 },
                { key: 'C', text: 'Debit all expenses, Credit all incomes', is_correct: 0 },
                { key: 'D', text: 'Debit capital, Credit drawings', is_correct: 0 }
              ]
            },
            {
              text: 'Which financial statement reports the financial position (Assets and Liabilities) of a business on a specific date?',
              section: 'Financial Statements',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Balance Sheet is a position statement showing Assets, Liabilities, and Equity as on a specific date.',
              options: [
                { key: 'A', text: 'Trial Balance', is_correct: 0 },
                { key: 'B', text: 'Profit & Loss Statement', is_correct: 0 },
                { key: 'C', text: 'Balance Sheet', is_correct: 1 },
                { key: 'D', text: 'Cash Flow Statement', is_correct: 0 }
              ]
            }
          ]
        },
        {
          title: 'GST Compliance & Invoicing Assessment',
          description: 'CGST, SGST, IGST, HSN/SAC codes, and Input Tax Credit (ITC) calculations.',
          duration_minutes: 30,
          total_marks: 20,
          negative_marks: 1.0,
          passing_marks: 8,
          questions: [
            {
              text: 'When goods are sold from one state to another (Inter-state supply), which GST component is levied?',
              section: 'GST Types',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Integrated Goods and Services Tax (IGST) is levied on all inter-state supplies and imports.',
              options: [
                { key: 'A', text: 'CGST + SGST', is_correct: 0 },
                { key: 'B', text: 'IGST', is_correct: 1 },
                { key: 'C', text: 'UTGST', is_correct: 0 },
                { key: 'D', text: 'SGST only', is_correct: 0 }
              ]
            },
            {
              text: 'What does HSN code stand for in GST invoicing?',
              section: 'GST Codes',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'HSN stands for Harmonized System of Nomenclature, used globally to classify goods.',
              options: [
                { key: 'A', text: 'Harmonized System of Nomenclature', is_correct: 1 },
                { key: 'B', text: 'Higher System of Notification', is_correct: 0 },
                { key: 'C', text: 'Header Standard Number', is_correct: 0 },
                { key: 'D', text: 'Home Sales Network', is_correct: 0 }
              ]
            },
            {
              text: 'What is the threshold limit of consignment value for generating mandatory E-Way Bill in inter-state transport?',
              section: 'E-Way Bill',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'An E-Way Bill is mandatory when the total consignment value exceeds ₹50,000.',
              options: [
                { key: 'A', text: '₹25,000', is_correct: 0 },
                { key: 'B', text: '₹50,000', is_correct: 1 },
                { key: 'C', text: '₹1,00,000', is_correct: 0 },
                { key: 'D', text: '₹2,00,000', is_correct: 0 }
              ]
            },
            {
              text: 'How many digits does a GSTIN (Goods and Services Tax Identification Number) contain?',
              section: 'GSTIN Structure',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'GSTIN is a 15-digit alphanumeric code: 2 state code + 10 PAN + 1 entity code + 1 Z + 1 checksum.',
              options: [
                { key: 'A', text: '10 Digits', is_correct: 0 },
                { key: 'B', text: '12 Digits', is_correct: 0 },
                { key: 'C', text: '15 Digits', is_correct: 1 },
                { key: 'D', text: '16 Digits', is_correct: 0 }
              ]
            },
            {
              text: 'Can Input Tax Credit (ITC) be claimed on goods used for personal consumption?',
              section: 'Input Tax Credit',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Under Section 17(5) of CGST Act, blocked credits include goods and services used for personal consumption.',
              options: [
                { key: 'A', text: 'Yes, fully', is_correct: 0 },
                { key: 'B', text: 'No, blocked under Section 17(5)', is_correct: 1 },
                { key: 'C', text: 'Yes, up to 50%', is_correct: 0 },
                { key: 'D', text: 'Only with Special Commissioner Permission', is_correct: 0 }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Logical Reasoning & Quantitative Speed Drill 2026',
      slug: 'logical-reasoning-speed-drill-' + Date.now(),
      category_id: 6,
      description: 'Rapid-fire free assessment pack designed to boost mental calculation speed, pattern recognition, seating arrangements, and analytical syllogisms.',
      thumbnail_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800',
      instructions: '• Fast-paced 30 minute mock\n• 4 marks per question with 1 mark negative marking\n• 100% Free for all authorized center students',
      exam_type: 'General Assessment',
      language: 'English + Hindi',
      difficulty: 'BEGINNER',
      total_tests: 2,
      price: 0.00,
      is_free: 1,
      duration_minutes: 30,
      validity_days: 180,
      publish_scope: 'ALL_CENTRES',
      payment_qr_id: 1,
      status: 'PUBLISHED',
      tests: [
        {
          title: 'Puzzles, Syllogisms & Seating Arrangement Mock',
          description: 'Linear seating, circular seating, direction sense, and blood relations.',
          duration_minutes: 15,
          total_marks: 20,
          negative_marks: 1.0,
          passing_marks: 8,
          questions: [
            {
              text: 'Statements: All mangoes are fruits. All fruits are sweet.\nConclusions:\nI. All mangoes are sweet.\nII. Some sweet are mangoes.',
              section: 'Syllogism',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Both conclusion I and II logically follow from the given universal affirmative statements.',
              options: [
                { key: 'A', text: 'Only I follows', is_correct: 0 },
                { key: 'B', text: 'Only II follows', is_correct: 0 },
                { key: 'C', text: 'Both I and II follow', is_correct: 1 },
                { key: 'D', text: 'Neither follows', is_correct: 0 }
              ]
            },
            {
              text: 'Pointing to a gentleman, Deepak said, "His only brother is the father of my daughter\'s father." How is the gentleman related to Deepak?',
              section: 'Blood Relations',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Daughter\'s father = Deepak. Father of Deepak = Deepak\'s father. Brother of Deepak\'s father = Deepak\'s Uncle.',
              options: [
                { key: 'A', text: 'Father', is_correct: 0 },
                { key: 'B', text: 'Uncle', is_correct: 1 },
                { key: 'C', text: 'Grandfather', is_correct: 0 },
                { key: 'D', text: 'Brother-in-law', is_correct: 0 }
              ]
            },
            {
              text: 'A person walks 10 km towards North, turns right and walks 5 km, then turns right again and walks 10 km. How far is he from his starting point?',
              section: 'Direction Sense',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'He moved 10 North, 5 East, 10 South. Net displacement = 5 km East from starting position.',
              options: [
                { key: 'A', text: '5 km East', is_correct: 1 },
                { key: 'B', text: '10 km North', is_correct: 0 },
                { key: 'C', text: '15 km East', is_correct: 0 },
                { key: 'D', text: '0 km', is_correct: 0 }
              ]
            },
            {
              text: 'Find the missing number in the sequence: 2, 6, 12, 20, 30, ?',
              section: 'Number Series',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Differences are +4, +6, +8, +10, so next difference is +12 => 30 + 12 = 42 (or n^2 + n: 1*2, 2*3, 3*4, 4*5, 5*6, 6*7=42).',
              options: [
                { key: 'A', text: '40', is_correct: 0 },
                { key: 'B', text: '42', is_correct: 1 },
                { key: 'C', text: '44', is_correct: 0 },
                { key: 'D', text: '48', is_correct: 0 }
              ]
            },
            {
              text: 'In a certain code language, if COMPUTER is written as RFUVQNPC, how will MEDICINE be written?',
              section: 'Coding Decoding',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Reverse the word, swap the first and last letters unchanged, and increment middle letters by +1 => EOJDJEFM.',
              options: [
                { key: 'A', text: 'EOJDEJFM', is_correct: 0 },
                { key: 'B', text: 'EOJDJEFM', is_correct: 1 },
                { key: 'C', text: 'MFEDJJOE', is_correct: 0 },
                { key: 'D', text: 'MFEJDJOE', is_correct: 0 }
              ]
            }
          ]
        },
        {
          title: 'Speed Arithmetic & Mental Math Sprint',
          description: 'Fast percentages, ratio tricks, simplification, and clock problems.',
          duration_minutes: 15,
          total_marks: 20,
          negative_marks: 1.0,
          passing_marks: 8,
          questions: [
            {
              text: 'What is the angle between the hour hand and the minute hand of a clock at 3:30?',
              section: 'Clocks',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Angle = |30*H - (11/2)*M| = |30*3 - 5.5*30| = |90 - 165| = 75 degrees.',
              options: [
                { key: 'A', text: '70 Degrees', is_correct: 0 },
                { key: 'B', text: '75 Degrees', is_correct: 1 },
                { key: 'C', text: '80 Degrees', is_correct: 0 },
                { key: 'D', text: '90 Degrees', is_correct: 0 }
              ]
            },
            {
              text: 'If 20% of a number is equal to 50, what is 60% of that number?',
              section: 'Percentages',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: '60% is 3 times 20%. So 3 * 50 = 150.',
              options: [
                { key: 'A', text: '120', is_correct: 0 },
                { key: 'B', text: '150', is_correct: 1 },
                { key: 'C', text: '180', is_correct: 0 },
                { key: 'D', text: '200', is_correct: 0 }
              ]
            },
            {
              text: 'A man buys a cycle for ₹1400 and sells it at a loss of 15%. What is the selling price of the cycle?',
              section: 'Profit and Loss',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'SP = 1400 * 0.85 = ₹1,190.',
              options: [
                { key: 'A', text: '₹1,190', is_correct: 1 },
                { key: 'B', text: '₹1,200', is_correct: 0 },
                { key: 'C', text: '₹1,160', is_correct: 0 },
                { key: 'D', text: '₹1,220', is_correct: 0 }
              ]
            },
            {
              text: 'The average age of 5 students is 14 years. If the teacher\'s age is included, the average becomes 18 years. What is the teacher\'s age?',
              section: 'Averages',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: 'Total students age = 5 * 14 = 70. Total with teacher = 6 * 18 = 108. Teacher\'s age = 108 - 70 = 38 years.',
              options: [
                { key: 'A', text: '35 Years', is_correct: 0 },
                { key: 'B', text: '38 Years', is_correct: 1 },
                { key: 'C', text: '40 Years', is_correct: 0 },
                { key: 'D', text: '42 Years', is_correct: 0 }
              ]
            },
            {
              text: 'Simplify: sqrt(144) + sqrt(169) - sqrt(81).',
              section: 'Simplification',
              type: 'SINGLE_CHOICE',
              marks: 4,
              negative: 1.0,
              explanation: '12 + 13 - 9 = 25 - 9 = 16.',
              options: [
                { key: 'A', text: '14', is_correct: 0 },
                { key: 'B', text: '16', is_correct: 1 },
                { key: 'C', text: '18', is_correct: 0 },
                { key: 'D', text: '20', is_correct: 0 }
              ]
            }
          ]
        }
      ]
    }
  ];

  for (const s of seriesData) {
    const [resSeries] = await pool.query(`
      INSERT INTO test_series (
        title, slug, category_id, description, thumbnail_url, instructions,
        exam_type, language, difficulty, total_tests, price, is_free,
        duration_minutes, validity_days, publish_scope, payment_qr_id,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      s.title,
      s.slug,
      s.category_id,
      s.description,
      s.thumbnail_url,
      s.instructions,
      s.exam_type,
      s.language,
      s.difficulty,
      s.tests.length,
      s.price,
      s.is_free,
      s.duration_minutes,
      s.validity_days,
      s.publish_scope,
      s.payment_qr_id,
      s.status
    ]);

    const seriesId = resSeries.insertId;
    console.log('✓ Created Test Series:', s.title, 'with ID:', seriesId);

    for (const t of s.tests) {
      const [resTest] = await pool.query(`
        INSERT INTO tests (
          test_series_id, title, description, question_count, duration_minutes,
          total_marks, negative_marks, passing_marks, release_type, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IMMEDIATE', 'LIVE')
      `, [
        seriesId,
        t.title,
        t.description,
        t.questions.length,
        t.duration_minutes,
        t.total_marks,
        t.negative_marks,
        t.passing_marks
      ]);

      const testId = resTest.insertId;

      for (let i = 0; i < t.questions.length; i++) {
        const q = t.questions[i];
        const [resQ] = await pool.query(`
          INSERT INTO questions (
            test_id, question_text, section_name, question_type, explanation,
            marks, negative_marks, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          testId,
          q.text,
          q.section,
          q.type,
          q.explanation,
          q.marks,
          q.negative,
          i + 1
        ]);

        const qId = resQ.insertId;

        for (const opt of q.options) {
          await pool.query(`
            INSERT INTO question_options (
              question_id, option_key, option_text, is_correct
            ) VALUES (?, ?, ?, ?)
          `, [qId, opt.key, opt.text, opt.is_correct]);
        }
      }
    }
  }

  console.log('🎉 Successfully created 5 demo test series with 10 tests and 50 questions!');
  await pool.end();
})();
