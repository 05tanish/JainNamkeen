/**
 * Standard Success Response
 *
 * Usage:
 *   successResponse(res, { message: "Users fetched", data: users });
 *   successResponse(res, { message: "User created", data: newUser, statusCode: 201 });
 */

export const successResponse = (
    res,
    {
        statusCode = 200,
        message = "Success",
        data = null,
    } = {} // 👈 prevents crash if no object is passed
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};