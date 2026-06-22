import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// TODO: Implement image upload with your chosen storage service
// Options:
// - Cloudflare R2
// - AWS S3
// - Supabase Storage
// - Other object storage

export async function uploadRoomImage(
  file: File,
  roomId: string
): Promise<string> {
  // Placeholder - implement with your storage service
  throw new Error("Image upload not implemented. Please configure your storage service.");

  // Example with Supabase Storage:
  // const fileName = `${roomId}/${Date.now()}-${file.name}`;
  // const { data, error } = await supabase.storage
  //   .from("room-images")
  //   .upload(fileName, file, {
  //     cacheControl: "3600",
  //     upsert: false,
  //   });

  // if (error) {
  //   throw new Error(`Failed to upload image: ${error.message}`);
  // }

  // const { data: publicData } = supabase.storage
  //   .from("room-images")
  //   .getPublicUrl(fileName);

  // return publicData.publicUrl;
}

export async function deleteRoomImage(imageUrl: string): Promise<void> {
  // Placeholder - implement with your storage service
  throw new Error("Image deletion not implemented. Please configure your storage service.");
}

export async function listRoomImages(roomId: string): Promise<string[]> {
  // Placeholder - implement with your storage service
  return [];
}