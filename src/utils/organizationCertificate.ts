import { uploadImages } from './uploadImages';

export const CERTIFICATE_MAX_BYTES = 5 * 1024 * 1024;
const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function validateOrganizationCertificate(file: File): Promise<void> {
  if (!extensions[file.type] || file.size === 0 || file.size > CERTIFICATE_MAX_BYTES) {
    throw new Error('Chọn ảnh JPG, PNG hoặc WebP có dung lượng tối đa 5 MB.');
  }
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const matches = file.type === 'image/jpeg'
    ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : file.type === 'image/png'
      ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
      : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!matches) throw new Error('Nội dung tệp không phải ảnh JPG, PNG hoặc WebP hợp lệ.');
}

export async function uploadOrganizationCertificate(file: File): Promise<string> {
  await validateOrganizationCertificate(file);
  const normalized = new File([file], `certificate.${extensions[file.type]}`, { type: file.type });
  const [url] = await uploadImages([normalized], 'organization-certificates');
  return url;
}
