import crypto from "crypto";

export const SECRET_KEY = Bun.env.SECRET_KEY || "TestDigivo2025"

export function generateHmacSignature(body: any):string {
	const payload = JSON.stringify(body)
	console.log("payload", payload);
	return crypto.createHmac('sha512', SECRET_KEY).update(payload).digest('hex')
}

export function verifySignature(body: any, headerSignature: string): boolean {
	const currentSignature = generateHmacSignature(body)
	console.log("verify", {currentSignature, headerSignature, result: currentSignature === headerSignature});
	return currentSignature === headerSignature
}