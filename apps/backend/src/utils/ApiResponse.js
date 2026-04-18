/**
 * Standard API Response class
 */
export class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export const successResponse = (
    res,
    {
        statusCode = 200,
        message = "Success",
        data = null,
    } = {}
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};