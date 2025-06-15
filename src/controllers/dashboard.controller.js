import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/likes.model.js";



//  Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
    //  first get the channel Id from the req.user._id middleware , check it 
    // now use $facet to run multiple aggregation simultaneously 

    const channelId = req.user?._id;

    if (!channelId) {
        throw new ApiError(400, "Unauthorized user please login");
    }

    const stats = await Video.aggregate([
        {
            $facet: {

                //get video stats
                videoStats: [
                    {
                        $match: {
                            owner: new mongoose.Types.ObjectId(channelId),
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalVideos: { $sum: 1 },
                            totalViews: { $sum: "$views" },
                            totalDuration: { $sum: "$duration" },
                        }
                    }
                ],

                //get subscriber count

                subscriberStats: [
                    {
                        $lookup: {
                            from: "subscriptions", 
                            let: {
                                channelId: new mongoose.Types.ObjectId(channelId)
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { // we have create a variable isiliye yaha $expression use karna padega to match equality
                                            //yaha error ayatha becoz of toString objectId 
                                            $or: [
                                                { $eq: ["$channel", "$$channelId"] },
                                                { $eq: ["$channel", { $toString: "$$channelId" }] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $count: "totalSubscribers" // becoz of channelID we get many documents we are counting the docs that maatches the channelId , if we match subscriberId then we are on wrong way becoz the subscriber user is only one we get the 1 document , that the reason we use channelId
                                }
                            ],
                            as: "subscribers"
                        }
                    },
                    {
                        $unwind: {
                            path: "$subscribers",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            totalSubscribers: {
                                $ifNull: ["$subscribers.totalSubscribers", 0] // agar user ka subs 0 hai crash na db we have to check ifNUll 
                            }
                        }
                    }
                ],

                // get likes count 

                likeStats: [
                    {
                        $match: {
                            owner: new mongoose.Types.ObjectId(channelId),
                        }
                    },
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes",
                        }
                    },
                    {
                        $unwind: {
                            path: "$likes",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalLikes: {
                                $sum: {
                                    $cond: [{ $ifNull: ["$likes", false] }, 1, 0]
                                }
                            }
                        }
                    }
                ],

                // get comment stats 

                commentStats: [
                    {
                        $match: {
                            owner: new mongoose.Types.ObjectId(channelId),
                        }
                    },
                    {
                        $lookup: {
                            from: "comments",
                            localField: "_id",
                            foreignField: "video",
                            as: "comments",
                        }
                    },
                    {
                        $unwind: {
                            path: "$comments",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalComments: {
                                $sum: {
                                    $cond: [{ $ifNull: ["$comments", false] }, 1, 0]
                                }
                            }
                        }
                    }
                ]


            }
        }
    ]);

    // take out the results from facet

    const videoStats = stats[0]?.videoStats[0] || {
        totalVideos: 0,
        totalDuration: 0,
        totalViews: 0,
    };

    const subscriberStats = stats[0]?.subscriberStats[0] || {
        totalSubscribers: 0,
    };

    const likeStats = stats[0]?.likeStats[0] || {
        totalLikes: 0,
    };

    const commentStats = stats[0]?.commentStats[0] || {
        totalComments: 0,
    };

    const channelInfo = await User.findById(channelId).select("username fullName email avatar createdAt");

    if (!channelInfo) {
        throw new ApiError(404, "Channel not found");
    }

    // Calculate additional metrics
    const avgViewsPerVideo = videoStats.totalVideos > 0
        ? Math.round(videoStats.totalViews / videoStats.totalVideos)
        : 0;

    const totalEngagement = likeStats.totalLikes + commentStats.totalComments;
    const engagementRate = videoStats.totalViews > 0
        ? ((totalEngagement / videoStats.totalViews) * 100).toFixed(2)
        : 0;

    // Format duration (convert seconds to hours:minutes format)
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const channelStats = {
        channel: {
            _id: channelInfo._id,
            username: channelInfo.username,
            fullName: channelInfo.fullName,
            avatar: channelInfo.avatar,
            email: channelInfo.email,
            joinedDate: channelInfo.createdAt,
        },

        stats: {
            //videostats
            totalVideos: videoStats.totalVideos,
            totalViews: videoStats.totalViews,
            totalDuration: formatDuration(videoStats.totalDuration), avgViewsPerVideo,

            //subs stats
            totalSubscribers: subscriberStats.totalSubscribers,


            //likes stats
            totalLikes: likeStats.totalLikes,

            totalLikes: likeStats.totalLikes,
            totalComments: commentStats.totalComments,
            totalEngagement,
            engagementRate: `${engagementRate}%`,

            videosPublished: videoStats.totalVideos,
        },
        generatedAt: new Date()
    };

    return res.status(200).json(new ApiResponse(200, channelStats, "Channel statistics fetched successfully"))

});


//  Get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;

    // Validate channelId
    if (!channelId?.trim() || !mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Validate sort direction
    const sortDirection = sortType === "desc" ? -1 : 1;

    // Build aggregation pipeline
    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
                isPublished: true // Only get published videos
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                likesCount: 1
            }
        },
        {
            $sort: {
                [sortBy]: sortDirection
            }
        }
    ];

    // Get total count for pagination
    const totalVideosPipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
                isPublished: true
            }
        },
        {
            $count: "totalVideos"
        }
    ];

    // Execute both pipelines
    const [videos, totalCountResult] = await Promise.all([
        Video.aggregate([
            ...pipeline,
            { $skip: skip },
            { $limit: limitNumber }
        ]),
        Video.aggregate(totalVideosPipeline)
    ]);

    const totalVideos = totalCountResult[0]?.totalVideos || 0;
    const totalPages = Math.ceil(totalVideos / limitNumber);

    // Check if channel exists (if no videos found, verify channel exists)
    if (videos.length === 0 && totalVideos === 0) {
        // Check if channel exists
        const channelExists = await Video.findOne({
            owner: new mongoose.Types.ObjectId(channelId)
        });

        if (!channelExists) {
            // Also check in users collection to see if channel exists but has no videos
            const User = mongoose.model('User');
            const userExists = await User.findById(channelId);
            if (!userExists) {
                throw new ApiError(404, "Channel not found");
            }
        }
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalVideos,
                    hasNextPage: pageNumber < totalPages,
                    hasPrevPage: pageNumber > 1,
                    limit: limitNumber
                }
            },
            "Channel videos fetched successfully"
        )
    );
});

export { getChannelStats, getChannelVideos };