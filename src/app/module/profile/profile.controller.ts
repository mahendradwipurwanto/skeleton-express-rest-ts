import {Router} from "express";
import {ResponseSuccessBuilder} from "@/lib/helper/response";

import {ProfileService} from "./profile.service";
import {UserService} from "@/app/module/users/users.service";
import {CustomHttpExceptionError} from "@/lib/helper/customError";

export class ProfileController {
    public router: Router;
    private userService: UserService;
    private notificationService: ProfileService;

    constructor(userService: UserService, notificationService: ProfileService) {
        this.router = Router();
        this.userService = userService;
        this.notificationService = notificationService;
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/', this.getUserProfile);
        this.router.patch('/', this.updateUserProfile);
        this.router.get('/notification', this.getNotificationByUser);
    }

    getUserProfile = async (req, res, next) => {
        try {
            const userId: string = req.id;
            const user = await this.userService.GetUserByParams({user_id: userId});

            if (!user) {
                throw new CustomHttpExceptionError("Profile data not found", 404);
            }

            return ResponseSuccessBuilder(res, 200, "Success getting profile data", user);
        } catch (error) {
            next(error);
        }
    }

    updateUserProfile = async (req, res, next) => {
        try {
            const userId: string = req.id;
            const data = req.body;
            const result = await this.userService.UpdateUserPatch(userId, data);

            return ResponseSuccessBuilder(res, 200, "Success updating user data", result);
        } catch (error) {
            next(error);
        }
    }

    getNotificationByUser = async (req, res, next) => {
        try {
            const id: string = req.id;
            const limit: number = req.query.limit || 10;
            const notification = await this.notificationService.GetById(id, limit);

            if (notification.total > 0) {
                // go through each notification data and check the reff_type
                for (const data of notification.notifications) {
                    if (data.reff_type === 'user') {
                        // get user data
                    }
                }
            }

            return ResponseSuccessBuilder(res, 200, "Success getting user notifications", notification);
        } catch (error) {
            next(error);
        }
    }
}