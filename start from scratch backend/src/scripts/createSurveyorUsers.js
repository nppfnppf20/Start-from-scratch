// One-time migration script to create User records for all surveyor contacts
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const SurveyorOrganisation = require('../models/SurveyorOrganisation');
const User = require('../models/User');

async function createSurveyorUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Fetch all surveyor organisations
        const organisations = await SurveyorOrganisation.find({});
        console.log(`Found ${organisations.length} surveyor organisations`);

        // Extract all unique emails
        const emailsSet = new Set();
        organisations.forEach(org => {
            if (org.contacts && Array.isArray(org.contacts)) {
                org.contacts.forEach(contact => {
                    if (contact.email) {
                        emailsSet.add(contact.email.toLowerCase());
                    }
                });
            }
        });

        const emails = Array.from(emailsSet);
        console.log(`Found ${emails.length} unique surveyor contact emails`);

        // Create User records for emails that don't have one
        let created = 0;
        let skipped = 0;

        for (const email of emails) {
            const existingUser = await User.findOne({ email });

            if (!existingUser) {
                const newUser = new User({
                    email,
                    role: 'surveyor'
                    // No password - Auth0 will handle authentication
                });
                await newUser.save();
                console.log(`✓ Created User record for: ${email}`);
                created++;
            } else {
                console.log(`- User already exists: ${email}`);
                skipped++;
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Created: ${created} new users`);
        console.log(`Skipped: ${skipped} existing users`);
        console.log(`Total: ${emails.length} surveyor contacts`);

        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

createSurveyorUsers();
