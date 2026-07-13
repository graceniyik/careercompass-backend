import { PrismaClient, QuestionType, RiasecDimension } from '@prisma/client';

const prisma = new PrismaClient();

async function seedQuestions() {
  const existingCount = await prisma.assessmentQuestion.count();
  if (existingCount > 0) {
    console.log('Questions already seeded — skipping.');
    return;
  }

  const riasecQuestions: { text: string; dimension: RiasecDimension }[] = [
    {
      text: 'I enjoy working with tools, machines, or building things.',
      dimension: 'REALISTIC',
    },
    {
      text: 'I like physical activities and working with my hands.',
      dimension: 'REALISTIC',
    },
    {
      text: 'I prefer practical, hands-on tasks over abstract theory.',
      dimension: 'REALISTIC',
    },
    {
      text: 'I enjoy solving complex problems and analyzing data.',
      dimension: 'INVESTIGATIVE',
    },
    {
      text: 'I like conducting research and testing ideas.',
      dimension: 'INVESTIGATIVE',
    },
    {
      text: 'I am curious about how things work at a deep level.',
      dimension: 'INVESTIGATIVE',
    },
    {
      text: 'I enjoy creative activities like writing, art, or music.',
      dimension: 'ARTISTIC',
    },
    {
      text: 'I like expressing myself through original ideas.',
      dimension: 'ARTISTIC',
    },
    {
      text: 'I prefer unstructured tasks that allow creative freedom.',
      dimension: 'ARTISTIC',
    },
    {
      text: 'I enjoy helping, teaching, or caring for others.',
      dimension: 'SOCIAL',
    },
    {
      text: 'I like working in teams and building relationships.',
      dimension: 'SOCIAL',
    },
    {
      text: "I feel motivated when I can support someone else's growth.",
      dimension: 'SOCIAL',
    },
    {
      text: 'I enjoy leading projects and persuading others.',
      dimension: 'ENTERPRISING',
    },
    {
      text: 'I like taking initiative and pursuing ambitious goals.',
      dimension: 'ENTERPRISING',
    },
    {
      text: 'I am comfortable taking risks to achieve a result.',
      dimension: 'ENTERPRISING',
    },
    {
      text: 'I enjoy organizing information and following clear procedures.',
      dimension: 'CONVENTIONAL',
    },
    {
      text: 'I like structured tasks with clear rules and expectations.',
      dimension: 'CONVENTIONAL',
    },
    {
      text: 'I am detail-oriented and prefer accuracy over improvisation.',
      dimension: 'CONVENTIONAL',
    },
  ];

  for (let i = 0; i < riasecQuestions.length; i++) {
    await prisma.assessmentQuestion.create({
      data: {
        type: QuestionType.LIKERT,
        text: riasecQuestions[i].text,
        riasecDimension: riasecQuestions[i].dimension,
        order: i + 1,
      },
    });
  }

  const qualitativeQuestions = [
    'Describe a project or activity you enjoyed recently and explain why.',
    'What does your ideal workday look like?',
    'What is a skill or subject you would like to get better at, and why?',
  ];

  for (let i = 0; i < qualitativeQuestions.length; i++) {
    await prisma.assessmentQuestion.create({
      data: {
        type: QuestionType.QUALITATIVE,
        text: qualitativeQuestions[i],
        order: riasecQuestions.length + i + 1,
      },
    });
  }

  console.log('Questions seeded.');
}

async function seedSkills(): Promise<Map<string, string>> {
  const skillNames = [
    'JavaScript',
    'Python',
    'SQL',
    'Data Analysis',
    'Public Speaking',
    'Graphic Design',
    'Project Management',
    'Writing',
    'Problem Solving',
    'Teamwork',
    'Leadership',
    'Research',
    'Accounting',
    'Marketing',
    'UX Design',
  ];

  const skillMap = new Map<string, string>();

  for (const name of skillNames) {
    const skill = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    skillMap.set(name, skill.id);
  }

  console.log('Skills seeded (or already existed).');
  return skillMap;
}

async function seedCareers(skillMap: Map<string, string>) {
  const existingCount = await prisma.career.count();
  if (existingCount > 0) {
    console.log('Careers already seeded — skipping.');
    return;
  }

  const careers = [
    {
      title: 'Software Engineer',
      description:
        'Designs, builds, and maintains software systems and applications.',
      riasecCode: {
        REALISTIC: 70,
        INVESTIGATIVE: 85,
        ARTISTIC: 30,
        SOCIAL: 40,
        ENTERPRISING: 20,
        CONVENTIONAL: 55,
      },
      skills: ['JavaScript', 'Python', 'Problem Solving'],
      roadmap: [
        {
          order: 1,
          title: 'Learn programming fundamentals',
          description: 'Start with Python or JavaScript.',
        },
        {
          order: 2,
          title: 'Build small projects',
          description: 'Apply your skills to real, practical projects.',
        },
        {
          order: 3,
          title: 'Learn version control & collaboration',
          description: 'Practice with Git and GitHub.',
        },
      ],
    },
    {
      title: 'Data Scientist',
      description:
        'Analyzes complex data to extract insights and support decision-making.',
      riasecCode: {
        REALISTIC: 40,
        INVESTIGATIVE: 90,
        ARTISTIC: 20,
        SOCIAL: 30,
        ENTERPRISING: 35,
        CONVENTIONAL: 60,
      },
      skills: ['Python', 'SQL', 'Data Analysis', 'Research'],
      roadmap: [
        {
          order: 1,
          title: 'Learn statistics fundamentals',
          description: 'Build a foundation in probability and statistics.',
        },
        {
          order: 2,
          title: 'Learn Python and SQL',
          description: 'Practice data manipulation and querying.',
        },
        {
          order: 3,
          title: 'Work on real datasets',
          description: 'Practice with public datasets and small projects.',
        },
      ],
    },
    {
      title: 'UX/UI Designer',
      description:
        'Designs intuitive, user-friendly digital interfaces and experiences.',
      riasecCode: {
        REALISTIC: 20,
        INVESTIGATIVE: 45,
        ARTISTIC: 85,
        SOCIAL: 55,
        ENTERPRISING: 40,
        CONVENTIONAL: 30,
      },
      skills: ['UX Design', 'Graphic Design', 'Research'],
      roadmap: [
        {
          order: 1,
          title: 'Learn design principles',
          description: 'Study color, typography, and layout fundamentals.',
        },
        {
          order: 2,
          title: 'Learn a design tool',
          description: 'Practice with tools like Figma.',
        },
        {
          order: 3,
          title: 'Build a portfolio',
          description: 'Create 2-3 sample projects showcasing your process.',
        },
      ],
    },
    {
      title: 'Marketing Manager',
      description:
        'Plans and executes strategies to promote products, services, or brands.',
      riasecCode: {
        REALISTIC: 15,
        INVESTIGATIVE: 35,
        ARTISTIC: 55,
        SOCIAL: 60,
        ENTERPRISING: 85,
        CONVENTIONAL: 45,
      },
      skills: ['Marketing', 'Public Speaking', 'Leadership'],
      roadmap: [
        {
          order: 1,
          title: 'Learn marketing fundamentals',
          description: 'Study branding, positioning, and consumer behavior.',
        },
        {
          order: 2,
          title: 'Practice on real campaigns',
          description: 'Volunteer or intern to run a small campaign.',
        },
        {
          order: 3,
          title: 'Build leadership experience',
          description: 'Take on projects that require coordinating a team.',
        },
      ],
    },
    {
      title: 'Accountant',
      description:
        'Manages financial records, reporting, and compliance for individuals or organizations.',
      riasecCode: {
        REALISTIC: 20,
        INVESTIGATIVE: 40,
        ARTISTIC: 10,
        SOCIAL: 25,
        ENTERPRISING: 30,
        CONVENTIONAL: 90,
      },
      skills: ['Accounting', 'Data Analysis'],
      roadmap: [
        {
          order: 1,
          title: 'Learn accounting fundamentals',
          description: 'Study bookkeeping and financial statements.',
        },
        {
          order: 2,
          title: 'Pursue a relevant certification',
          description: 'Consider certifications like ACCA or CPA.',
        },
      ],
    },
    {
      title: 'Research Scientist',
      description:
        'Conducts systematic investigation to develop and test new knowledge.',
      riasecCode: {
        REALISTIC: 45,
        INVESTIGATIVE: 95,
        ARTISTIC: 25,
        SOCIAL: 20,
        ENTERPRISING: 15,
        CONVENTIONAL: 50,
      },
      skills: ['Research', 'Data Analysis', 'Writing'],
      roadmap: [
        {
          order: 1,
          title: 'Build strong subject-matter knowledge',
          description: 'Go deep in your area of interest.',
        },
        {
          order: 2,
          title: 'Learn research methodology',
          description: 'Study experimental design and data analysis.',
        },
        {
          order: 3,
          title: 'Practice academic writing',
          description: 'Write up findings clearly and rigorously.',
        },
      ],
    },
    {
      title: 'Project Manager',
      description:
        'Plans, organizes, and oversees projects to ensure successful delivery.',
      riasecCode: {
        REALISTIC: 25,
        INVESTIGATIVE: 30,
        ARTISTIC: 15,
        SOCIAL: 55,
        ENTERPRISING: 75,
        CONVENTIONAL: 70,
      },
      skills: ['Project Management', 'Leadership', 'Teamwork'],
      roadmap: [
        {
          order: 1,
          title: 'Learn project management fundamentals',
          description: 'Study methodologies like Agile and Scrum.',
        },
        {
          order: 2,
          title: 'Practice coordinating a small project',
          description: 'Volunteer to lead a small team effort.',
        },
        {
          order: 3,
          title: 'Pursue certification',
          description: 'Consider certifications like PMP or CAPM.',
        },
      ],
    },
    {
      title: 'Content Writer / Journalist',
      description:
        'Researches and writes engaging content for various audiences and platforms.',
      riasecCode: {
        REALISTIC: 10,
        INVESTIGATIVE: 50,
        ARTISTIC: 80,
        SOCIAL: 45,
        ENTERPRISING: 30,
        CONVENTIONAL: 35,
      },
      skills: ['Writing', 'Research'],
      roadmap: [
        {
          order: 1,
          title: 'Practice writing regularly',
          description: 'Start a blog or write for a student publication.',
        },
        {
          order: 2,
          title: 'Build a portfolio',
          description: 'Collect your best pieces to showcase your range.',
        },
        {
          order: 3,
          title: 'Learn a niche',
          description: 'Develop expertise in a specific topic area.',
        },
      ],
    },
  ];

  for (const careerData of careers) {
    await prisma.career.create({
      data: {
        title: careerData.title,
        description: careerData.description,
        riasecCode: careerData.riasecCode,
        requiredSkills: {
          create: careerData.skills.map((skillName) => ({
            skillId: skillMap.get(skillName)!,
          })),
        },
        roadmapSteps: {
          create: careerData.roadmap,
        },
      },
    });
  }

  console.log('Careers seeded.');
}

async function main() {
  await seedQuestions();
  const skillMap = await seedSkills();
  await seedCareers(skillMap);
  console.log('All seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
