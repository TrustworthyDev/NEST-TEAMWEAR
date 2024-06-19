import { writeFile, rename } from 'fs/promises';

/**
 * Writes a temporary file with the data specified,
 * then renames the temporary file to the final name.
 * The temporary file has the same name as the final file with
 * a .tmp extension.
 */
export async function writeFileWithTemp(
  filename: string,
  data: Parameters<typeof writeFile>[1],
): Promise<void> {
  const tempName = filename.concat('.tmp');
  await writeFile(tempName, data);
  return rename(tempName, filename);
}
