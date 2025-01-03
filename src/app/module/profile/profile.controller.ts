import {Router} from "express";
import {ResponseSuccessBuilder} from "@/lib/helper/response";

import {ProfileService} from "./profile.service";
import {UserService} from "@/app/module/users/users.service";
import {CustomHttpExceptionError} from "@/lib/helper/customError";
import {Limiter} from "@/app/middleware/limiter";
import multer from "multer";

// multer image upload preparation
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 1 MB

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {fileSize: IMAGE_MAX_SIZE_BYTES},
    fileFilter: (_req, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
        if (!allowedTypes.includes(file.mimetype)) {
            return callback(new CustomHttpExceptionError('Invalid file type. Only jpg, png, jpeg, and webp files are allowed.', 400));
        }
        callback(null, true);
    }
});

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
        this.router.patch('/', Limiter(5 * 1000, 1), this.updateUserProfile);
        this.router.put('/picture', Limiter(5 * 1000, 1), upload.single("file"), this.updateProfilePicture);
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

    updateProfilePicture = async (req, res, next) => {
        try {
            const id: string = req.id;
            const file: Express.Multer.File | undefined = req.file;
            if (!file) {
                throw new CustomHttpExceptionError("Image required", 400);
            }
            const result = await this.userService.UploadPhoto(id, file);
            return ResponseSuccessBuilder(res, 200, "Success update the profile picture", result);
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