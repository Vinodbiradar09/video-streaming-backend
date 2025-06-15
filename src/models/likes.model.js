import mongoose, {Schema , model} from "mongoose";

const likeSchema = new Schema({
    video : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video",
    },
    comment : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Comment",
    },
    tweet : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Tweet",
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required: true  // Always required
    }
}, {timestamps : true});


const Like = model("Like" , likeSchema);
export {Like}; 