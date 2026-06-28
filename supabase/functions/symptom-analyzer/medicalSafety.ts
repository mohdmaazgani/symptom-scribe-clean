const emergencyKeywords = [
    "chest pain",
    "difficulty breathing",
    "shortness of breath",
    "stroke",
    "seizure",
    "unconscious",
    "suicidal",
    "heart attack",
    "severe bleeding",
];

type Message = {
    content: string;
};

export function detectEmergencySymptoms(messages: Message[]) {
    const combinedText = messages
        .map((msg) => msg.content.toLowerCase())
        .join(" ");

    const matchedKeywords = emergencyKeywords.filter((keyword) => {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`\\b${escaped}\\b`, "i");
        return pattern.test(combinedText);
    });

    return {
        isEmergency: matchedKeywords.length > 0,
        matchedKeywords,
    };
}
