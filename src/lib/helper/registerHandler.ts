export default function GetRegisteredField(checkUser: any, payload: any, fields: string[]): string | null {
    for (const field of fields) {
        // Access the value from checkUser (handle nested fields)
        const checkUserValue = field.includes('.') ? getNestedValue(checkUser, field) : checkUser?.[field];

        // Extract the last part of the field for payload (always flat)
        const payloadKey = field.includes('.') ? field.split('.').pop()! : field;
        const payloadValue = payload?.[payloadKey];

        console.log("checkUserValue", checkUserValue, payloadValue);

        // If both values exist and match, return the last part of the field path
        if (checkUserValue !== undefined && payloadValue !== undefined && checkUserValue === payloadValue) {
            return payloadKey; // Return the last part of the field
        }
    }
    return null; // Return null if no match is found
}

// Helper function to get nested values
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
