require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');

// Admin emails to add
const adminEmails = [
    { email: 'robert.shaw@thirdrevolutionprojects.co.uk', name: 'Robert Shaw' },
    { email: 'andrew.dowell@thirdrevolutionprojects.co.uk', name: 'Andrew Dowell' },
    { email: 'dan.hay@thirdrevolutionprojects.co.uk', name: 'Dan Hay' },
    { email: 'rowan.kinnaird@thirdrevolutionprojects.co.uk', name: 'Rowan Kinnaird' },
    { email: 'stefano.smith@thirdrevolutionprojects.co.uk', name: 'Stefano Smith' },
    { email: 'sandy.scott@thirdrevolutionprojects.co.uk', name: 'Sandy Scott' },
    { email: 'richard.mosinghi@thirdrevolutionprojects.co.uk', name: 'Richard Mosinghi' }
];

async function addAdmins() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const adminData of adminEmails) {
            try {
                // Check if admin already exists
                const existingAdmin = await Admin.findOne({ email: adminData.email });

                if (existingAdmin) {
                    if (existingAdmin.isActive) {
                        console.log(`⏭️  ${adminData.email} - Already exists and is active`);
                        skippedCount++;
                    } else {
                        // Reactivate if inactive
                        existingAdmin.isActive = true;
                        existingAdmin.name = adminData.name;
                        await existingAdmin.save();
                        console.log(`✅ ${adminData.email} - Reactivated`);
                        updatedCount++;
                    }
                } else {
                    // Create new admin
                    const newAdmin = new Admin({
                        email: adminData.email,
                        name: adminData.name,
                        isActive: true
                    });
                    await newAdmin.save();
                    console.log(`✅ ${adminData.email} - Added successfully`);
                    addedCount++;
                }
            } catch (error) {
                console.error(`❌ Error processing ${adminData.email}:`, error.message);
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   Added: ${addedCount}`);
        console.log(`   Updated: ${updatedCount}`);
        console.log(`   Skipped (already active): ${skippedCount}`);
        console.log(`   Total: ${adminEmails.length}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run the script
addAdmins();
