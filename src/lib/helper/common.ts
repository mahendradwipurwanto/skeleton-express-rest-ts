import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/id";
import sizeOf from 'image-size';
import fs from "fs";
import base64 from "base64-js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

const TIMEZONE = "Asia/Jakarta";

// Function to generate random number
export async function GenerateRandomNumber(length: number): Promise<number> {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// function to convert to camel case
export async function ToCamelCase(str: string) {
    if (!str) return str;
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// function to create name from email
export async function CreateNameFromEmail(email: string) {
    // add remove special character or number replace it with space
    email = email.split("@")[0];
    email = email.replace(/[^a-zA-Z]/g, ' ');
    return email;
}

// Function to get timestamp
export async function GetTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// convert string with format ${year}${month}${day}${hours}${minutes}${seconds} function above to dayjs
export async function ConvertTimestampToDayjs(timestamp: string) {
    return dayjs(timestamp, "YYYYMMDDHHmmss").utc();
}

// Function to anonymize string
export function AnonymizeString(name: string): string {
    const words = name.split(" ");

    const anonymizeWord = (word: string): string => {
        if (word.length <= 2) {
            return word; // If word is too short, don't anonymize
        }
        // Keep the first and last letter, replace the rest with '*'
        return word[0] + "*".repeat(word.length - 2) + word[word.length - 1];
    };

    const firstWord = anonymizeWord(words[0]);
    const lastWord = anonymizeWord(words[words.length - 1]);

    return `${firstWord} ${lastWord}`;
}

// Function to create slug
export async function CreateSlug(str: string): Promise<string> {
    const maxLength = 255;

    let slug = str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');

    if (slug.length > maxLength) {
        slug = slug.substring(0, maxLength);
        slug = slug.replace(/-+$/, '');
    }

    return slug;
}

// Function to calculate age
export function calculateAge(param: any) {

    const today = dayjs().tz(TIMEZONE); // Current date in Jakarta timezone
    const birthDate = dayjs(param).tz(TIMEZONE); // Birthdate in Jakarta timezone

    // Calculate age difference
    let age = today.year() - birthDate.year();

    // Adjust age if the birthday hasn't occurred yet this year
    if (today.month() < birthDate.month() ||
        (today.month() === birthDate.month() && today.date() < birthDate.date())) {
        age--;
    }

    return age;
}

// Function to validate image dimensions
export async function validateImageDimensions(file: Express.Multer.File, maxWidth: number, maxHeight: number): Promise<boolean> {
    const dimensions = sizeOf(file.buffer);
    return dimensions.width <= maxWidth && dimensions.height <= maxHeight;
}

// Function to encode image to base64
export function encodeImage(imagePath: string): string {
    const image = fs.readFileSync(imagePath);
    return base64.fromByteArray(new Uint8Array(image));
}

// function to substring number
export function substringNumber(str: number, length: number) {
    return parseInt(str.toString().substring(0, length));
}