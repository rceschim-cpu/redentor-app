// Cloudinary — upload gratuito de arquivos (sem Firebase Storage)
// Configurar com os valores do painel em cloudinary.com
const CLOUD_NAME = 'SEU_CLOUD_NAME';   // ex: 'dxyz123abc'
const UPLOAD_PRESET = 'SEU_PRESET';    // ex: 'redentor_unsigned'

export async function uploadToCloudinary(
  file: File
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  // 'auto' aceita qualquer tipo: PDF, imagem, vídeo, etc.
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Erro no upload (HTTP ${res.status})`);
  }
  const data = await res.json();
  return { url: data.secure_url as string, publicId: data.public_id as string };
}
