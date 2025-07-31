import {Elysia, t} from "elysia";
import { verifySignature } from "./hmac";
import sharp from "sharp";
import { writeFileSync, unlinkSync } from "fs";
import { isModuleBody } from "typescript";
import staticPlugin from "@elysiajs/static";

const SERVER_HOST = Bun.env.SERVER_HOST || 'localhost'
const SERVER_PORT = Bun.env.SERVER_PORT || 8000
const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`

const app = new Elysia();
app.use(staticPlugin())
app.get("/", ()=> "Hello Elysia");
app.post('/convert', async ({body, headers, set}) => {
	console.log("request info", {headers, body});
	/* Validasi HMAC */
		try {
			/* Check Header Authorization */
			const signature = headers['authorization']?.replace('HMAC ', '') as string;
			if(!signature) {
				return {
					status: 401,
					body: {
						message: 'unauthorized'
					}
				}
			}

			/* Check Validasi HMAC */
			if(!verifySignature(body, signature)) {
				return {
					status: 401,
					body: {
						message: 'unauthorized'
					}
				}
			}

		} catch (error: any) {
			set.status = 500;
			return {
				status: 500,
				body: {
					message: error?.message ?? "Terjadi kesalahan pada server"
				}
			}
		}
	/* Validasi HMAC */

	try {
		/* Cek Body data */
		if (!body) {
			set.status = 400;
			return { status: "error", message: "File gambar tidak ditemukan" };
		}
		const { file, compress_ratio } = body;

		if (!file || file.size === 0) {
			set.status = 400;
			return { status: "error", message: "File gambar tidak ditemukan" };
		}

		const quality = Number(compress_ratio) || 60;
		/* Cek Body data */
		/* Proses image */
			console.info("Process Image", {fileName: file.name, quality})
			const newFileName = `${crypto.randomUUID()}.webp`;
			const bufferImage = Buffer.from(await file.arrayBuffer());
			
			const compressImage = await sharp(bufferImage)
			.webp({quality: quality})
			.toBuffer()
	
			const storagePath = 'public/upload'
			const finalPath = `${storagePath}/${newFileName}`;
	
			writeFileSync('./'+finalPath, compressImage);

			let xServerUrl = SERVER_URL.replace('0.0.0.0', 'localhost')
			const actualPath = `${xServerUrl}/${finalPath}`;
	
			return {
				file: actualPath,
				status: 'success'
			}
		/* Proses image */
	} catch (error) {
		console.error(error)
	}
	
}, {
	body: t.Object({
		file: t.File({
			type: 'image'
		}),
		compress_ratio: t.Any()
	})
})

app.listen({
	hostname: SERVER_HOST,
	port: SERVER_PORT
}, () => {
	console.log(`Server running on ${SERVER_URL}`);
});