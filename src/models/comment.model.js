import mongoose, {Schema ,model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";



const commentSchema = new Schema(
    
    {
        content : {
            type : String,
            required : true,
        },
        video : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Video"
        },
        owner : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        }
    } ,
    
    
    {timestamps : true}

)

commentSchema.plugin(mongooseAggregatePaginate);

const Comment = model("Comment" , commentSchema);

export {Comment};