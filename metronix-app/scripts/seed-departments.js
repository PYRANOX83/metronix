const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const departments = [
  {
    name: 'Public Works Department',
    keywords: JSON.stringify(['roads', 'potholes', 'street lights', 'sidewalks', 'drainage', 'infrastructure'])
  },
  {
    name: 'Water Supply Department',
    keywords: JSON.stringify(['water', 'leakage', 'pipeline', 'water supply', 'drainage', 'sewage'])
  },
  {
    name: 'Electricity Department',
    keywords: JSON.stringify(['electricity', 'power', 'outage', 'street lights', 'wiring', 'transformer'])
  },
  {
    name: 'Sanitation Department',
    keywords: JSON.stringify(['sanitation', 'garbage', 'waste', 'cleaning', 'hygiene', 'disposal'])
  },
  {
    name: 'Environmental Department',
    keywords: JSON.stringify(['noise', 'pollution', 'environment', 'air quality', 'sound'])
  },
  {
    name: 'Transportation Department',
    keywords: JSON.stringify(['parking', 'traffic', 'transportation', 'vehicles', 'road safety'])
  },
  {
    name: 'General Administration',
    keywords: JSON.stringify(['general', 'other', 'miscellaneous', 'administration', 'public services'])
  }
];

async function seedDepartments() {
  try {
    console.log('Starting to seed departments...');
    
    // Check if departments already exist
    const existingDepartments = await prisma.department.findMany();
    
    if (existingDepartments.length > 0) {
      console.log(`Found ${existingDepartments.length} existing departments:`);
      existingDepartments.forEach(dept => {
        console.log(`- ${dept.name}`);
      });
      
      console.log('Do you want to add more departments? (y/n)');
      // For now, let's just add if there are less than expected
      if (existingDepartments.length >= departments.length) {
        console.log('All expected departments already exist. Skipping seed.');
        return;
      }
    }
    
    // Add new departments
    for (const dept of departments) {
      const existing = await prisma.department.findUnique({
        where: { name: dept.name }
      });
      
      if (!existing) {
        const created = await prisma.department.create({
          data: dept
        });
        console.log(`Created department: ${created.name}`);
      } else {
        console.log(`Department already exists: ${dept.name}`);
      }
    }
    
    console.log('Department seeding completed!');
    
    // Show all departments
    const allDepartments = await prisma.department.findMany();
    console.log('\nAll departments in database:');
    allDepartments.forEach(dept => {
      console.log(`- ${dept.name}`);
    });
    
  } catch (error) {
    console.error('Error seeding departments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDepartments();