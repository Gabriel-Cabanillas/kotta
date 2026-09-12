import 'server-only'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024
type ImageFolder = 'tickets' | 'evidencias' | 'amenidades'
const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

class ImageUploadError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

function detectedMime(buffer: Buffer) {
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

export async function uploadImage(file: FormDataEntryValue, orgId: string, destination: ImageFolder): Promise<string> {
  // Nunca usar el nombre original, ni un folder/public_id enviado por el cliente.
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(orgId) || !['tickets', 'evidencias', 'amenidades'].includes(destination)) {
    throw new ImageUploadError('Destino de imagen inválido', 400)
  }
  if (!(file instanceof Blob) || file.size === 0) throw new ImageUploadError('La imagen está vacía o es inválida', 400)
  if (file.size > MAX_IMAGE_BYTES) throw new ImageUploadError('La imagen no debe superar 4 MB', 413)
  if (!MIME_TYPES.includes(file.type)) throw new ImageUploadError('Solo se permiten imágenes JPEG, PNG o WebP', 415)

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.length === 0 || buffer.length !== file.size) throw new ImageUploadError('La imagen es inválida', 400)
  if (buffer.length > MAX_IMAGE_BYTES) throw new ImageUploadError('La imagen no debe superar 4 MB', 413)
  if (detectedMime(buffer) !== file.type) throw new ImageUploadError('El contenido no corresponde al tipo de imagen', 415)

  // La firma es un filtro inicial, no un decodificador. Cloudinary debe aceptar
  // y convertir el contenido como imagen; nunca se permite subirlo como raw/auto.
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: `kotta/${orgId}/${destination}`,
      public_id: randomBytes(24).toString('hex'),
      resource_type: 'image',
      allowed_formats: ['jpg', 'png', 'webp'],
      format: 'webp',
      overwrite: false,
      use_filename: false,
      unique_filename: true,
      transformation: [{ quality: 'auto', fetch_format: 'webp' }],
      timeout: 60000,
    }, (error, uploaded) => {
      if (error) {
        reject(new ImageUploadError(error.http_code === 400 ? 'La imagen es inválida o no puede procesarse' : 'No fue posible subir la imagen', error.http_code === 400 ? 400 : 502))
      } else if (uploaded) resolve(uploaded)
      else reject(new ImageUploadError('No fue posible subir la imagen', 502))
    })
    stream.on('error', () => reject(new ImageUploadError('No fue posible subir la imagen', 502)))
    stream.end(buffer)
  })
  if (result.resource_type !== 'image' || result.format !== 'webp' || result.existing === true || result.overwritten === true ||
      !Number.isFinite(result.width) || !Number.isFinite(result.height) || result.width <= 0 || result.height <= 0 || !result.secure_url) {
    throw new ImageUploadError('No fue posible validar la imagen subida', 502)
  }
  const url = new URL(result.secure_url)
  if (url.protocol !== 'https:' || url.username || url.password) throw new ImageUploadError('No fue posible validar la imagen subida', 502)
  return url.toString()
}

export function imageUploadErrorResponse(error: unknown) {
  // No devolver ni registrar errores crudos del SDK: pueden incluir configuración.
  return NextResponse.json({ error: error instanceof ImageUploadError ? error.message : 'No fue posible subir la imagen' }, {
    status: error instanceof ImageUploadError ? error.status : 502,
  })
}
