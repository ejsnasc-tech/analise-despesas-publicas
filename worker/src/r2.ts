export async function salvarArquivo(bucket: R2Bucket, key: string, file: File): Promise<void> {
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream"
    }
  });
}

export async function deletarArquivo(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

export async function getArquivo(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}
