import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const standardBoards = [
  {
    name: 'CBSE (Central Board of Secondary Education)',
    code: 'CBSE',
    category: 'SCHOOL',
    description: 'National board of education in India for public and private schools.',
    defaultPatternsJson: JSON.stringify([
      {
        name: 'CBSE Standard 80 Marks Blueprint',
        totalMarks: 80,
        durationMinutes: 180,
        sections: [
          { sectionName: 'Section A', sectionTitle: 'Multiple Choice Questions', questionType: 'MCQ', count: 20, marksPerQ: 1 },
          { sectionName: 'Section B', sectionTitle: 'Very Short Answer Questions', questionType: 'SHORT_ANSWER', count: 5, marksPerQ: 2 },
          { sectionName: 'Section C', sectionTitle: 'Short Answer Questions', questionType: 'SHORT_ANSWER', count: 6, marksPerQ: 3 },
          { sectionName: 'Section D', sectionTitle: 'Long Answer Questions', questionType: 'LONG_ANSWER', count: 4, marksPerQ: 5 },
          { sectionName: 'Section E', sectionTitle: 'Case Study / Competency Questions', questionType: 'APPLICATION', count: 3, marksPerQ: 4 }
        ]
      },
      {
        name: 'CBSE Science/Practical Subject 70 Marks Blueprint',
        totalMarks: 70,
        durationMinutes: 180,
        sections: [
          { sectionName: 'Section A', sectionTitle: 'Multiple Choice & Assertion-Reason', questionType: 'MCQ', count: 16, marksPerQ: 1 },
          { sectionName: 'Section B', sectionTitle: 'Short Answer Questions', questionType: 'SHORT_ANSWER', count: 5, marksPerQ: 2 },
          { sectionName: 'Section C', sectionTitle: 'Short Answer Questions (Type II)', questionType: 'SHORT_ANSWER', count: 7, marksPerQ: 3 },
          { sectionName: 'Section D', sectionTitle: 'Case-Based Questions', questionType: 'APPLICATION', count: 2, marksPerQ: 4 },
          { sectionName: 'Section E', sectionTitle: 'Long Answer Questions', questionType: 'LONG_ANSWER', count: 3, marksPerQ: 5 }
        ]
      }
    ])
  },
  {
    name: 'Tamil Nadu State Board',
    code: 'STATE_TN',
    category: 'SCHOOL',
    description: 'Tamil Nadu State Board of School Examination for Secondary & Higher Secondary (+1, +2).',
    defaultPatternsJson: JSON.stringify([
      {
        name: 'TN Higher Secondary (+2) 70 Marks Pattern',
        totalMarks: 70,
        durationMinutes: 180,
        sections: [
          { sectionName: 'Part I', sectionTitle: 'Choose the Correct Answer (One Mark)', questionType: 'MCQ', count: 15, marksPerQ: 1 },
          { sectionName: 'Part II', sectionTitle: 'Very Short Answer (Answer any 6 out of 9)', questionType: 'SHORT_ANSWER', count: 6, marksPerQ: 2 },
          { sectionName: 'Part III', sectionTitle: 'Short Answer (Answer any 6 out of 9)', questionType: 'SHORT_ANSWER', count: 6, marksPerQ: 3 },
          { sectionName: 'Part IV', sectionTitle: 'Detailed Answer (Either/Or Type)', questionType: 'LONG_ANSWER', count: 5, marksPerQ: 5 }
        ]
      },
      {
        name: 'TN SSLC (10th Standard) 100 Marks Pattern',
        totalMarks: 100,
        durationMinutes: 180,
        sections: [
          { sectionName: 'Part I', sectionTitle: 'Multiple Choice Questions', questionType: 'MCQ', count: 14, marksPerQ: 1 },
          { sectionName: 'Part II', sectionTitle: 'Two Marks (Answer any 10 out of 14)', questionType: 'SHORT_ANSWER', count: 10, marksPerQ: 2 },
          { sectionName: 'Part III', sectionTitle: 'Five Marks (Answer any 10 out of 14)', questionType: 'LONG_ANSWER', count: 10, marksPerQ: 5 },
          { sectionName: 'Part IV', sectionTitle: 'Eight Marks Geometry/Graph/Descriptive', questionType: 'LONG_ANSWER', count: 2, marksPerQ: 8 }
        ]
      }
    ])
  },
  {
    name: 'Engineering Semester Examination (AICTE / University)',
    code: 'ENGG_SEM',
    category: 'COLLEGE',
    description: 'Autonomous & Affiliated Engineering Colleges Semester Examination.',
    defaultPatternsJson: JSON.stringify([
      {
        name: 'University 100 Marks End-Semester Exam',
        totalMarks: 100,
        durationMinutes: 180,
        sections: [
          { sectionName: 'Part A', sectionTitle: 'Short Answer Questions (10 x 2 Marks)', questionType: 'SHORT_ANSWER', count: 10, marksPerQ: 2 },
          { sectionName: 'Part B', sectionTitle: 'Analytical / Long Answer (5 x 13 Marks - Either/Or)', questionType: 'LONG_ANSWER', count: 5, marksPerQ: 13 },
          { sectionName: 'Part C', sectionTitle: 'Application / Design / Case Study (1 x 15 Marks)', questionType: 'APPLICATION', count: 1, marksPerQ: 15 }
        ]
      }
    ])
  },
  {
    name: 'Arts & Science College Semester Examination',
    code: 'ARTS_SCI',
    category: 'COLLEGE',
    description: 'Undergraduate & Postgraduate Semester Examinations for Arts and Science.',
    defaultPatternsJson: JSON.stringify([
      {
        name: 'Standard 75 Marks College Pattern',
        totalMarks: 75,
        durationMinutes: 180,
        sections: [
          { sectionName: 'Section A', sectionTitle: 'Multiple Choice / Short Recall (10 x 1)', questionType: 'MCQ', count: 10, marksPerQ: 1 },
          { sectionName: 'Section B', sectionTitle: 'Short Answers (5 x 5)', questionType: 'SHORT_ANSWER', count: 5, marksPerQ: 5 },
          { sectionName: 'Section C', sectionTitle: 'Essay / Comprehensive Questions (4 x 10)', questionType: 'ESSAY', count: 4, marksPerQ: 10 }
        ]
      }
    ])
  },
  {
    name: 'NEET (National Eligibility cum Entrance Test)',
    code: 'NEET',
    category: 'COMPETITIVE',
    description: 'Medical entrance exam standard pattern.',
    defaultPatternsJson: JSON.stringify([
      {
        name: 'NEET Subject Unit Test (180 Marks)',
        totalMarks: 180,
        durationMinutes: 60,
        sections: [
          { sectionName: 'Section A', sectionTitle: 'Compulsory MCQs (35 Questions x 4 Marks)', questionType: 'MCQ', count: 35, marksPerQ: 4 },
          { sectionName: 'Section B', sectionTitle: 'Optional MCQs (Answer 10 out of 15 x 4 Marks)', questionType: 'MCQ', count: 10, marksPerQ: 4 }
        ]
      }
    ])
  },
  {
    name: 'JEE Main (Joint Entrance Examination)',
    code: 'JEE_MAIN',
    category: 'COMPETITIVE',
    description: 'National entrance exam for engineering admissions.',
    defaultPatternsJson: JSON.stringify([
      {
        name: 'JEE Subject Test (100 Marks)',
        totalMarks: 100,
        durationMinutes: 60,
        sections: [
          { sectionName: 'Section A', sectionTitle: 'Multiple Choice Questions (20 x 4 Marks)', questionType: 'MCQ', count: 20, marksPerQ: 4 },
          { sectionName: 'Section B', sectionTitle: 'Numerical Value Questions (5 x 4 Marks)', questionType: 'NUMERICAL', count: 5, marksPerQ: 4 }
        ]
      }
    ])
  },
  {
    name: 'UPSC / TNPSC / Civil Services',
    code: 'CIVIL_SERVICES',
    category: 'COMPETITIVE',
    description: 'State & National Public Service Commission examinations.',
    defaultPatternsJson: JSON.stringify([
      {
        name: 'General Studies Mains Descriptive Test (100 Marks)',
        totalMarks: 100,
        durationMinutes: 120,
        sections: [
          { sectionName: 'Section A', sectionTitle: 'Short Analytical Questions (10 x 4 Marks)', questionType: 'SHORT_ANSWER', count: 10, marksPerQ: 4 },
          { sectionName: 'Section B', sectionTitle: 'Comprehensive Essay / Analytical Answers (4 x 15 Marks)', questionType: 'ESSAY', count: 4, marksPerQ: 15 }
        ]
      }
    ])
  }
];

async function main() {
  console.log('Seeding standard boards and templates...');
  for (const board of standardBoards) {
    await prisma.board.upsert({
      where: { code: board.code },
      update: {
        name: board.name,
        category: board.category,
        description: board.description,
        defaultPatternsJson: board.defaultPatternsJson
      },
      create: board
    });
  }
  console.log('Database successfully seeded with standard boards and blueprints.');

  console.log('Seeding default institution and user accounts...');
  let defaultInst = await prisma.institution.findFirst({
    where: { name: 'Apex Institute of Science & Technology' }
  });

  if (!defaultInst) {
    defaultInst = await prisma.institution.create({
      data: {
        name: 'Apex Institute of Science & Technology',
        address: 'Knowledge Campus, Chennai, Tamil Nadu',
        contactEmail: 'contact@apex.edu'
      }
    });
  }

  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('12345678', salt);
  const teacherPasswordHash = await bcrypt.hash('SecurePassword123!', salt);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', salt);

  const initialUsers = [
    {
      email: 'manasa@158',
      name: 'Manasa',
      role: 'TEACHER',
      passwordHash: commonPasswordHash,
      institutionId: defaultInst.id
    },
    {
      email: 'manasa@gmail.com',
      name: 'Manasa',
      role: 'TEACHER',
      passwordHash: commonPasswordHash,
      institutionId: defaultInst.id
    },
    {
      email: 'teacher@qgenai.edu',
      name: 'Senior Teacher',
      role: 'TEACHER',
      passwordHash: teacherPasswordHash,
      institutionId: defaultInst.id
    },
    {
      email: 'admin@qgenai.edu',
      name: 'System Administrator',
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
      institutionId: defaultInst.id
    }
  ];

  for (const user of initialUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash: user.passwordHash,
        institutionId: user.institutionId
      },
      create: user
    });
  }
  console.log('Default accounts successfully verified and seeded:');
  console.log(' - manasa@158 (password: 12345678)');
  console.log(' - manasa@gmail.com (password: 12345678)');
  console.log(' - teacher@qgenai.edu (password: SecurePassword123!)');
  console.log(' - admin@qgenai.edu (password: AdminPassword123!)');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

