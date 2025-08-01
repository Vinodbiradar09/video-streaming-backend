import mongoose , {Schema , model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
    {

        videoFile : {
            type : String , // cloudinary url
            required : true,
        },

        thumbnail : {
               type : String , // cloudinary url
            required : true,
        },
        title : {
            type : String,
            required : true
        },
        description : {
            type : String,
            required : true,
        },
        duration : {
            type : Number,
            required : true,
        },
        views : {
            type : Number,
            default : 0,
        },
        isPublished : {
            type : Boolean,
            default : true
        },
        owner : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
        },

    },
    {
        timestamps : true
    }

)

videoSchema.plugin(mongooseAggregatePaginate);

const Video = model("Video" , videoSchema);

export {Video};

// if we have to use mongooseaggregate we have to import it , post it has a plugin