const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quote = require('../models/Quote');

// @route   GET /api/surveyors
// @desc    Get surveyor organisations grouped by organisation + discipline
// @access  Protected (Admin only)
router.get('/', async (req, res) => {
    try {
        const aggregationPipeline = [
            // Step 1: Group by the case-sensitive organisation and discipline
            {
                $group: {
                    _id: {
                        organisation: "$organisation",
                        discipline: "$discipline"
                    },
                    quotes: { $push: "$$ROOT" },
                    contacts: { $addToSet: { name: "$contactName", email: "$email", phoneNumber: "$phoneNumber" } }
                }
            },
            
            // Step 2: Lookup surveyor feedback for all quotes in each group
            {
                $lookup: {
                    from: "surveyorfeedbacks",
                    localField: "quotes._id",
                    foreignField: "quoteId",
                    as: "feedbacks"
                }
            },

            // Step 3: Unwind the feedbacks array to process each one
            {
                $unwind: {
                    path: "$feedbacks",
                    preserveNullAndEmptyArrays: true // Keep orgs that have no feedback
                }
            },

            // Step 4: Sort by the feedback creation date to order notes chronologically
            {
                $sort: {
                    "feedbacks.createdAt": 1 // 1 for ascending (oldest first)
                }
            },
            
            // Step 5: Group back to the organisation/discipline level
            {
                $group: {
                    _id: "$_id",
                    originalQuotes: { $first: "$quotes" },
                    contacts: { $first: "$contacts" },
                    // Push the now-sorted feedback docs back into an array
                    sortedFeedbacks: { $push: "$feedbacks" } 
                }
            },

            // Step 6: Final projection of all data
            {
                $project: {
                    _id: 0,
                    id: { $concat: ["$_id.organisation", "-", "$_id.discipline"] },
                    organisation: "$_id.organisation",
                    discipline: "$_id.discipline",
                    contacts: { $filter: { input: "$contacts", cond: { $ne: ["$$this.name", null] }}},
                    totalQuotes: { $size: "$originalQuotes" },
                    totalInstructed: {
                        $size: {
                            $filter: {
                                input: "$originalQuotes",
                                as: "quote",
                                cond: { $in: ["$$quote.instructionStatus", ["instructed", "partially instructed"]] }
                            }
                        }
                    },
                    averageRatings: {
                        quality: { $round: [{ $avg: "$sortedFeedbacks.quality" }, 1] },
                        responsiveness: { $round: [{ $avg: "$sortedFeedbacks.responsiveness" }, 1] },
                        deliveredOnTime: { $round: [{ $avg: "$sortedFeedbacks.deliveredOnTime" }, 1] },
                        overallReview: { $round: [{ $avg: "$sortedFeedbacks.overallReview" }, 1] }
                    },
                    // Filter out any null/empty notes from the sorted array
                    collatedNotes: {
                        $filter: {
                            input: "$sortedFeedbacks.notes",
                            as: "note",
                            cond: { $and: [ { $ne: [ "$$note", null ] }, { $ne: [ "$$note", "" ] } ] }
                        }
                    }
                }
            },
            
            // Step 7: Final sort of the organisations themselves
            { $sort: { organisation: 1, discipline: 1 } }
        ];

        console.log('Executing aggregation pipeline with sorted notes...');
        const surveyors = await Quote.aggregate(aggregationPipeline);
        
        console.log(`Found ${surveyors.length} surveyor organisation-discipline combinations`);
        res.json(surveyors);

    } catch (err) {
        console.error('Error aggregating surveyor data:', err.message);
        res.status(500).json({ 
            msg: 'Server Error', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

module.exports = router; 