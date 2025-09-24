const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Connect to the SQLite database
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

async function seedCompleteData() {
  return new Promise((resolve, reject) => {
    console.log('Starting comprehensive data seeding...');
    
    // First, let's add some sample users (citizens, solvers, admin)
    const users = [
      {
        id: 'user_admin_001',
        name: 'Admin User',
        email: 'admin@metronix.com',
        password: bcrypt.hashSync('admin123', 10),
        role: 'ADMIN',
        emailVerified: new Date().toISOString()
      },
      {
        id: 'user_citizen_001', 
        name: 'John Doe',
        email: 'john.doe@email.com',
        password: bcrypt.hashSync('citizen123', 10),
        role: 'CITIZEN',
        emailVerified: new Date().toISOString()
      },
      {
        id: 'user_citizen_002',
        name: 'Jane Smith', 
        email: 'jane.smith@email.com',
        password: bcrypt.hashSync('citizen123', 10),
        role: 'CITIZEN',
        emailVerified: new Date().toISOString()
      },
      {
        id: 'user_solver_001',
        name: 'Mike Johnson',
        email: 'mike.johnson@email.com', 
        password: bcrypt.hashSync('solver123', 10),
        role: 'SOLVER',
        emailVerified: new Date().toISOString()
      },
      {
        id: 'user_solver_002',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@email.com',
        password: bcrypt.hashSync('solver123', 10), 
        role: 'SOLVER',
        emailVerified: new Date().toISOString()
      }
    ];

    // Sample complaints
    const complaints = [
      {
        id: 'complaint_001',
        userId: 'user_citizen_001',
        title: 'Pothole on Main Street',
        description: 'Large pothole approximately 2 feet wide on Main Street near the intersection with Oak Avenue. Causing traffic issues and potential damage to vehicles.',
        category: 'ROADS',
        priority: 'HIGH',
        status: 'SUBMITTED',
        location: 'Main Street & Oak Avenue',
        lat: 40.7128,
        lng: -74.0060,
        citizenId: 'user_citizen_001',
        departmentId: 'dept_roads_001',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'complaint_002',
        userId: 'user_citizen_002',
        title: 'Water Leak in Residential Area',
        description: 'Water leaking from underground pipe on Elm Street. Water is pooling on the street and there is reduced water pressure in nearby houses.',
        category: 'WATER',
        priority: 'HIGH',
        status: 'ASSIGNED',
        location: 'Elm Street, Block 300-400',
        lat: 40.7589,
        lng: -73.9851,
        citizenId: 'user_citizen_002',
        departmentId: 'dept_water_001',
        solverId: 'user_solver_001',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: 'complaint_003',
        userId: 'user_citizen_001',
        title: 'Street Light Not Working',
        description: 'Street light on the corner of Pine Street and 5th Avenue is not working. Area is very dark at night and poses safety concerns for pedestrians.',
        category: 'ELECTRICITY',
        priority: 'NORMAL',
        status: 'RESOLVED',
        location: 'Pine Street & 5th Avenue',
        lat: 40.7505,
        lng: -73.9934,
        citizenId: 'user_citizen_001',
        departmentId: 'dept_electricity_001',
        solverId: 'user_solver_002',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        id: 'complaint_004',
        userId: 'user_citizen_002',
        title: 'Garbage Collection Missed',
        description: 'Garbage was not collected on our street this week. Bins are overflowing and creating unpleasant odors and potential health hazards.',
        category: 'SANITATION',
        priority: 'NORMAL',
        status: 'SUBMITTED',
        location: 'Maple Drive, Residential Area',
        lat: 40.7614,
        lng: -73.9776,
        citizenId: 'user_citizen_002',
        departmentId: 'dept_sanitation_001',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'complaint_005',
        userId: 'user_citizen_001',
        title: 'Excessive Noise from Construction',
        description: 'Construction work on the building next door starts very early in the morning (6 AM) and continues until late evening, creating excessive noise for residents.',
        category: 'NOISE',
        priority: 'LOW',
        status: 'SUBMITTED',
        location: 'Downtown Area, 42nd Street',
        lat: 40.7549,
        lng: -73.9840,
        citizenId: 'user_citizen_001',
        departmentId: 'dept_environmental_001',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Progress logs
    const progressLogs = [
      {
        id: 'log_001',
        complaintId: 'complaint_002',
        status: 'ASSIGNED',
        note: 'Complaint assigned to Mike Johnson from Water Supply Department for investigation and repair.',
        userId: 'user_admin_001',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log_002',
        complaintId: 'complaint_003',
        status: 'ASSIGNED',
        note: 'Street light repair assigned to Sarah Wilson from Electricity Department.',
        userId: 'user_admin_001',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log_003',
        complaintId: 'complaint_003',
        status: 'RESOLVED',
        note: 'Street light has been repaired and is now working properly. Issue was faulty wiring connection.',
        userId: 'user_solver_002',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Function to insert data
    function insertData(table, data) {
      return new Promise((resolve, reject) => {
        if (!data || data.length === 0) {
          resolve(0);
          return;
        }

        const keys = Object.keys(data[0]);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT OR IGNORE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        
        let inserted = 0;
        let processed = 0;

        data.forEach(row => {
          const values = keys.map(key => row[key]);
          
          db.run(sql, values, function(err) {
            if (err) {
              console.error(`Error inserting into ${table}:`, err);
            } else if (this.changes > 0) {
              inserted++;
            }
            
            processed++;
            if (processed === data.length) {
              console.log(`Inserted ${inserted} records into ${table}`);
              resolve(inserted);
            }
          });
        });
      });
    }

    // Insert data in sequence
    async function runSeeding() {
      try {
        console.log('Inserting users...');
        await insertData('users', users);
        
        console.log('Inserting complaints...');
        await insertData('complaints', complaints);
        
        console.log('Inserting progress logs...');
        await insertData('progress_logs', progressLogs);
        
        console.log('\nSeeding completed successfully!');
        
        // Show summary
        console.log('\n=== SEEDING SUMMARY ===');
        console.log(`Users: ${users.length}`);
        console.log(`Complaints: ${complaints.length}`);
        console.log(`Progress Logs: ${progressLogs.length}`);
        
      } catch (error) {
        console.error('Error during seeding:', error);
      } finally {
        db.close();
        resolve();
      }
    }

    runSeeding();
  });
}

// Check if bcryptjs is available, if not install it
try {
  require('bcryptjs');
  seedCompleteData();
} catch (e) {
  console.log('bcryptjs not found, installing...');
  const { exec } = require('child_process');
  exec('npm install bcryptjs', (error) => {
    if (error) {
      console.error('Error installing bcryptjs:', error);
      return;
    }
    seedCompleteData();
  });
}