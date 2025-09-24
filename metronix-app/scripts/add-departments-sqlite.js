const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the SQLite database
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

const departments = [
  {
    id: 'dept_roads_001',
    name: 'Public Works Department',
    keywords: JSON.stringify(['roads', 'potholes', 'street lights', 'sidewalks', 'drainage', 'infrastructure'])
  },
  {
    id: 'dept_water_001',
    name: 'Water Supply Department',
    keywords: JSON.stringify(['water', 'leakage', 'pipeline', 'water supply', 'drainage', 'sewage'])
  },
  {
    id: 'dept_electricity_001',
    name: 'Electricity Department',
    keywords: JSON.stringify(['electricity', 'power', 'outage', 'street lights', 'wiring', 'transformer'])
  },
  {
    id: 'dept_sanitation_001',
    name: 'Sanitation Department',
    keywords: JSON.stringify(['sanitation', 'garbage', 'waste', 'cleaning', 'hygiene', 'disposal'])
  },
  {
    id: 'dept_environmental_001',
    name: 'Environmental Department',
    keywords: JSON.stringify(['noise', 'pollution', 'environment', 'air quality', 'sound'])
  },
  {
    id: 'dept_transportation_001',
    name: 'Transportation Department',
    keywords: JSON.stringify(['parking', 'traffic', 'transportation', 'vehicles', 'road safety'])
  },
  {
    id: 'dept_general_001',
    name: 'General Administration',
    keywords: JSON.stringify(['general', 'other', 'miscellaneous', 'administration', 'public services'])
  }
];

async function addDepartments() {
  return new Promise((resolve, reject) => {
    console.log('Starting to add departments to SQLite database...');
    
    // Check if departments table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='departments'", (err, row) => {
      if (err) {
        console.error('Error checking table:', err);
        reject(err);
        return;
      }
      
      if (!row) {
        console.log('Departments table does not exist. Creating it...');
        
        // Create departments table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            keywords TEXT NOT NULL
          )
        `;
        
        db.run(createTableSQL, (err) => {
          if (err) {
            console.error('Error creating table:', err);
            reject(err);
            return;
          }
          console.log('Departments table created successfully');
          insertDepartments();
        });
      } else {
        console.log('Departments table exists');
        insertDepartments();
      }
    });
    
    function insertDepartments() {
      // Check existing departments
      db.all("SELECT id, name FROM departments", (err, existingRows) => {
        if (err) {
          console.error('Error checking existing departments:', err);
          reject(err);
          return;
        }
        
        console.log(`Found ${existingRows.length} existing departments:`);
        existingRows.forEach(row => {
          console.log(`- ${row.name} (${row.id})`);
        });
        
        // Insert new departments
        const insertSQL = `
          INSERT OR IGNORE INTO departments (id, name, keywords) 
          VALUES (?, ?, ?)
        `;
        
        let insertedCount = 0;
        departments.forEach((dept, index) => {
          db.run(insertSQL, [dept.id, dept.name, dept.keywords], function(err) {
            if (err) {
              console.error(`Error inserting ${dept.name}:`, err);
            } else if (this.changes > 0) {
              console.log(`Added department: ${dept.name}`);
              insertedCount++;
            } else {
              console.log(`Department already exists: ${dept.name}`);
            }
            
            if (index === departments.length - 1) {
              console.log(`\nDepartment seeding completed! Added ${insertedCount} new departments.`);
              
              // Show all departments
              db.all("SELECT id, name FROM departments", (err, allRows) => {
                if (!err) {
                  console.log('\nAll departments in database:');
                  allRows.forEach(row => {
                    console.log(`- ${row.name} (${row.id})`);
                  });
                }
                db.close();
                resolve();
              });
            }
          });
        });
      });
    }
  });
}

addDepartments().catch(console.error);