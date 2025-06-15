import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";




const healthcheck = asyncHandler(async (req, res) => {
    res.status(200).json(
        new ApiResponse(200, {
            status: "OK",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            service: "YouTube Backend API"
        }, "Service is healthy and running")
    );
});

export{healthcheck};



