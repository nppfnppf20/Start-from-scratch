const mongoose = require('mongoose');
const Quote = require('./src/models/Quote');

// Migration script to add 'item' field to existing line items

async function migrateLineItems() {
    try {
        console.log('🔄 Starting line items migration...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/start-from-scratch');
        console.log('✅ Connected to MongoDB');

        // Find quotes with line items that don't have the 'item' field
        const quotesNeedingMigration = await Quote.find({
            'lineItems.item': { $exists: false }
        });

        console.log(`📊 Found ${quotesNeedingMigration.length} quotes needing migration`);

        if (quotesNeedingMigration.length === 0) {
            console.log('✅ No migration needed - all quotes already have item field');
            return;
        }

        let migratedCount = 0;

        for (const quote of quotesNeedingMigration) {
            // Update each line item to have a default 'item' value based on description
            const updatedLineItems = quote.lineItems.map(lineItem => {
                if (!lineItem.item) {
                    // Create a default item value from the description
                    // Take first few words or use a generic fallback
                    const defaultItem = lineItem.description 
                        ? lineItem.description.split(' ').slice(0, 2).join(' ') || 'Survey Work'
                        : 'Survey Work';
                    
                    return {
                        ...lineItem.toObject(),
                        item: defaultItem
                    };
                }
                return lineItem;
            });

            // Update the quote with migrated line items
            await Quote.findByIdAndUpdate(quote._id, {
                $set: { lineItems: updatedLineItems }
            });

            migratedCount++;
            console.log(`✅ Migrated quote ${quote._id} (${migratedCount}/${quotesNeedingMigration.length})`);
        }

        console.log(`🎉 Successfully migrated ${migratedCount} quotes`);
        console.log('✅ Migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateLineItems();
}

module.exports = migrateLineItems; 