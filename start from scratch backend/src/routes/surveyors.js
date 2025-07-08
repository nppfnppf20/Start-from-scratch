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
                    totalQuotes: { $sum: 1 },
                    // NEW: Conditionally sum up instructed quotes
                    totalInstructed: {
                        $sum: {
                            $cond: [
                                { $in: ["$instructionStatus", ["instructed", "partially instructed"]] },
                                1, // Add 1 if instructed
                                0  // Add 0 if not
                            ]
                        }
                    },
                    contacts: {
                        $addToSet: {
                            name: "$contactName",
                            email: "$email",
                            phoneNumber: "$phoneNumber"
                        }
                    }
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
            
            // Step 3: Calculate average ratings and format output
            {
                $project: {
                    _id: 0, // Exclude the default _id
                    id: { $concat: ["$_id.organisation", "-", "$_id.discipline"] },
                    organisation: "$_id.organisation",
                    discipline: "$_id.discipline",
                    contacts: {
                        $filter: {
                            input: "$contacts",
                            cond: { $ne: ["$$this.name", null] }
                        }
                    },
                    totalQuotes: "$totalQuotes",
                    totalInstructed: "$totalInstructed", // Pass the new field through
                    averageRatings: {
                        $let: {
                            vars: {
                                validFeedbacks: {
                                    $filter: {
                                        input: "$feedbacks",
                                        as: "feedback",
                                        cond: { $ne: ["$$feedback", null] }
                                    }
                                }
                            },
                            in: {
                                quality: { $round: [{ $avg: "$$validFeedbacks.quality" }, 1] },
                                responsiveness: { $round: [{ $avg: "$$validFeedbacks.responsiveness" }, 1] },
                                deliveredOnTime: { $round: [{ $avg: "$$validFeedbacks.deliveredOnTime" }, 1] },
                                overallReview: { $round: [{ $avg: "$$validFeedbacks.overallReview" }, 1] }
                            }
                        }
                    }
                }
            },
            
            // Step 4: Sort by organisation name then discipline
            {
                $sort: {
                    organisation: 1,
                    discipline: 1
                }
            }
        ];

        console.log('Executing updated surveyor aggregation pipeline with Total Instructed...');
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