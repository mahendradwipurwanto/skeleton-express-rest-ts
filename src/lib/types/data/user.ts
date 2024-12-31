import {RoleData} from "@/lib/types/data/role";

export interface User {
    id: string;
    email: string;
    username: string;
    password: string;
    pin: number;
    referral_code: string;
    type: number;
    status: number;
    created_at: Date;
    updated_at: Date;
    role: RoleData;
    user_data: UserData;
}

export interface UserData {
    id: string;
    user_id: string;
    profile: string;
    phone: string;
    name: string;
    province: string;
    city: string;
    district: string;
}