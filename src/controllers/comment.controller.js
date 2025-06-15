import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose,{isValidObjectId} from "mongoose";
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";


const addComent = asyncHandler (async ( req , res)=>{
    // get the comment from frontend , Check !
    // get the owner from loggedIn user , Check !
    // get the videoID from params to comment on a video , check for params 
    // now create a document 
    // check if the document is created or not 
    // and send res


    const {content} = req.body;
    const {videoId} = req.params;
    const owner = req.user._id;

    if(!content){
        throw new ApiError(404 , "Content is empty cant create a comment")
    }

    if(!videoId){
        throw new ApiError(404 , "VideoID is empty can't add the comment to that video")
    }

    if(!owner){
        throw new ApiError(404 , "the owner is empty please login to add the comment");
    }

const comment = await Comment.create({
    content,
    video : videoId,
    owner,
})

if(!comment){
    throw new ApiError(404 , "Falied to create a comment for video due to some issue");
}

res.status(200)
.json(new ApiResponse(200 , comment , "Successfully created your comment"));

})

const updateComment = asyncHandler (async ( req , res)=>{
    // get the new comment from frontend , check 
    // check the user is logged in or not 
    // get the comment id for changing it from , check 


    const {newComment} = req.body;

    if(!newComment){
        throw new ApiError(404 , "The content is empty can't create a empty comment");
    }

    const {commentId} =  req.params;

    if(!commentId){
        throw new ApiError(404 , "Invalid comment Id or empty comment Id"); 
    }

    const comment = await Comment.findByIdAndUpdate({_id : commentId},
        {
            $set : {
                content : newComment,
            }
        },
        {
            new : true,
        }
    )

    if(!comment){
        throw new ApiError(404 , "Failed to update the new comment");
    }

    res.status(200)
    .json(new ApiResponse(200 , comment , "Successfully update the new comment"));
})

const deleteComment = asyncHandler( async ( req , res)=>{
    // get the comment id from params , check 
    // now delete the comment 
    // send res

    const {commentId} = req.params;
    if(!commentId){
        throw new ApiError(404 , "The CommentId is empty or Invalid");
    }

    const delcomment = await Comment.findByIdAndDelete(commentId);

    if(!delcomment){
        throw new ApiError(404 , "Failed to delete the comment");
    }
    res.status(200)
    .json(new ApiResponse( 200 , delcomment , "Successfully deleted the comment"));
})

const getDetailsOfUserAndVideoWhichHeWasCommented = asyncHandler( async ( req , res)=>{

    // first get the comment Id from the params , check it 
    // do the match operation on the commentId , 
    // now lookup for User and Video details 
    // lastly project all the details 

    const {commentId} = req.params;
    if(!commentId){
        throw new ApiError(404 , "CommentId is empty or invalid");
    }

    const allDetailsOfComments = await Comment.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(commentId)
            }
        }, 
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "UserDetails",
                pipeline : [
                    {
                        $project : {
                            fullName : 1,
                            email : 1,
                            username : 1,
                            avatar : 1,
                        }
                    }
                ]
            },
            
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "videoDetails",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "videoUploadererDetails",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1,
                                        email : 1,
                                        username : 1,
                                        avatar : 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            uploader : {$arrayElemAt : ["$videoUploadererDetails", 0]}
                        }
                    },
                    {
                        $project : {
                           videoFile : 1,
                           thumbnail : 1,
                           title : 1,
                           description : 1,
                           duration : 1,
                           views : 1,
                           uploader : 1,
                        }
                    }
                ]
            }
        },
       {
        $addFields : {
            commentedPersonDetails : { $arrayElemAt : ["$UserDetails" ,0]},
            videoInfo : {$arrayElemAt : ["$videoDetails" , 0]}
        }
       },
       {
        $project : {
            content : 1,
            commentedPersonDetails : 1,
            video : "$videoInfo"
        }
       }
    ]);

    if(!allDetailsOfComments.length){
        throw new ApiError(404 , "Failed to fetch the user commented details");
    }

    res.status(200)
    .json(new ApiResponse(200 , allDetailsOfComments , "Successfully got the details of user videos and uploaded video owner details "));
})

const findCommentById = asyncHandler( async ( req , res)=>{
    // get the Id from params , check it 
    //findId and find the content and user who is commented at it 

    const {commentId} = req.params;

    if(!commentId){
        throw new ApiError(404 , "Invalid commentId or empty");
    }

    const commentandUserdetails = await Comment.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(commentId),
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "commentedUserDetails"
            }
        },
        {
            $project : {
                content : 1,
                "commentedUserDetails.username" : 1,
                "commentedUserDetails.avatar" : 1,
                "commentedUserDetails.email" : 1,
            }
        }
    ])

    if(!commentandUserdetails.length){
        throw new ApiError(404 , "Failed to fetch the commentedUserDetails");
    }

    res.status(200)
    .json(new ApiResponse(200 , commentandUserdetails[0] , "Successfully got the commentedUserDetails"));
})

const findAllTheCommentsMadeByUser = asyncHandler( async ( req , res)=>{
    // first get the userId , check 
    // using userId do aggregation and match the owner 
    // using this now we will lookup for the videos schema 

    const {usersId} = req.params
    if(!usersId){
        throw new ApiError(404 , "Invalid userId or empty or undefined");
    }

    const allComments = await Comment.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(usersId),
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "allTheVideosUserCommented",
            }
        },
        {
            $project : {
                content : 1,
                "allTheVideosUserCommented.videoFile" : 1,
                "allTheVideosUserCommented.thumbnail" : 1,
                "allTheVideosUserCommented.title" : 1,
                "allTheVideosUserCommented.description" : 1,
                "allTheVideosUserCommented.duration" : 1,
                "allTheVideosUserCommented.views" : 1,
            }
        }
    ])

    if(!allComments.length){
        throw new ApiError(404 , "Failed to fetch all the comments made by user");
    }

    res.status(200)
    .json(new ApiResponse(200 , allComments , "Successfully fetched all the comments"));
})

const getVideoCommentsAll = asyncHandler( async ( req , res)=>{
    // get the videoId from params , check it 
    // using aggregation match it in video field we put the videoId and we will get single video
    // extract paginate parameters from query 
    // convert to numbers
    // and now do aggregation for it 

    const {videoId} = req.params;

    const {page = 1 , limit = 10} = req.query;

    const pageNumber = parseInt(page);
    
    const limitNumber = parseInt(limit);

    if(!videoId){
        throw new ApiError(404 , "Video Id is invalid or empty , it must be requires");
    }

    if(!mongoose.isValidObjectId(videoId)){
        throw new AudioParam(404 , "Invalid Id format");
    }

       
    if (pageNumber < 1) {
        throw new ApiError(400, "Page number must be greater than 0");
    }
    
    if (limitNumber < 1 || limitNumber > 100) {
        throw new ApiError(400, "Limit must be between 1 and 100");
    }
     const options = {
        page: pageNumber,
        limit: limitNumber,
        customLabels: {
            totalDocs: 'totalComments',
            docs: 'comments',
            totalPages: 'totalPages',
            page: 'currentPage',
            nextPage: 'nextPage',
            prevPage: 'prevPage',
            hasNextPage: 'hasNextPage',
            hasPrevPage: 'hasPrevPage',
            pagingCounter: 'serialNumberStartFrom'
        }
    };

    const getAllTheCommentsOnTheVideo = await Comment.aggregatePaginate( Comment.aggregate([
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId),
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "allTheOwnersComments",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            email : 1,
                            avatar : 1,
                            fullName : 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$allTheOwnersComments",
        },
        // {
        //     $lookup : {
        //         from : "videos",
        //         localField : "video",
        //         foreignField : "_id",
        //         as : "videoDetails",
        //         pipeline : [
        //             {
        //                 $project : {
        //                     videoFile : 1,
        //                     thumbnail : 1,
        //                     duration : 1,
        //                     title : 1,
        //                     description : 1,
        //                     views : 1,
        //                 }
        //             }
        //         ]
        //     }
        // },
        // {
        //     $unwind : "$videoDetails",
        // },
        {
           $project : {
            content : 1,
            alluserComments : "$allTheOwnersComments",
            // aSingleVideo : "$videoDetails"
           }
        }
    ]) , options );

   if (getAllTheCommentsOnTheVideo.totalComments === 0) {
        return res
            .status(200)
            .json(new ApiResponse(
                200, 
                {
                    comments: [],
                    totalComments: 0,
                    currentPage: 1,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPrevPage: false,
                    nextPage: null,
                    prevPage: null
                }, 
                "No comments found for this video"
            ));
    }

    return res.status(200)
    .json(new ApiResponse( 200 , getAllTheCommentsOnTheVideo ,  `Comments fetched successfully - Page ${pageNumber} of ${getAllTheCommentsOnTheVideo.totalPages}`))

});
 
export {addComent , updateComment , deleteComment , getDetailsOfUserAndVideoWhichHeWasCommented , findCommentById , findAllTheCommentsMadeByUser , getVideoCommentsAll };


