import * as ImageManipulator from 'expo-image-manipulator'

export async function compressImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1920 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    )
    return result.uri
  } catch {
    return uri
  }
}

export async function createThumbnail(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG },
    )
    return result.uri
  } catch {
    return uri
  }
}