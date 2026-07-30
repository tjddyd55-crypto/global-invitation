import {
  ListObjectsV2Command,
  S3Client,
  type _Object as S3Object,
} from '@aws-sdk/client-s3';

export type InventoryObject = {
  key: string;
  size: number;
  etag: string | null;
  lastModified: string | null;
  contentType: string | null;
  topLevelPrefix: string;
};

export type R2ListClientConfig = {
  bucketName: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function topLevelPrefix(key: string): string {
  const normalized = key.replace(/^\/+/, '');
  const slash = normalized.indexOf('/');
  if (slash <= 0) return normalized ? `${normalized}/` : '';
  return `${normalized.slice(0, slash)}/`;
}

export function createCleanupS3Client(config: R2ListClientConfig): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * List every object in the bucket (full pagination). Never truncates after first page.
 */
export async function listEntireBucketInventory(
  client: S3Client,
  bucketName: string
): Promise<InventoryObject[]> {
  const objects: InventoryObject[] = [];
  let continuationToken: string | undefined;
  let pageCount = 0;

  do {
    pageCount += 1;
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })
    );

    for (const item of listed.Contents || []) {
      if (!item.Key) continue;
      objects.push(mapS3Object(item));
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  if (pageCount < 1) {
    throw new Error('R2_LIST_NO_PAGES');
  }

  return objects;
}

function mapS3Object(item: S3Object): InventoryObject {
  const key = item.Key || '';
  return {
    key,
    size: typeof item.Size === 'number' ? item.Size : 0,
    etag: item.ETag || null,
    lastModified: item.LastModified ? item.LastModified.toISOString() : null,
    contentType: null,
    topLevelPrefix: topLevelPrefix(key),
  };
}

export function summarizeTopLevelPrefixes(objects: InventoryObject[]): Array<{
  prefix: string;
  objectCount: number;
  totalBytes: number;
  minLastModified: string | null;
  maxLastModified: string | null;
  sampleKeys: string[];
}> {
  const map = new Map<
    string,
    {
      objectCount: number;
      totalBytes: number;
      minLastModified: string | null;
      maxLastModified: string | null;
      sampleKeys: string[];
    }
  >();

  for (const object of objects) {
    const current = map.get(object.topLevelPrefix) || {
      objectCount: 0,
      totalBytes: 0,
      minLastModified: null as string | null,
      maxLastModified: null as string | null,
      sampleKeys: [] as string[],
    };
    current.objectCount += 1;
    current.totalBytes += object.size;
    if (object.lastModified) {
      if (!current.minLastModified || object.lastModified < current.minLastModified) {
        current.minLastModified = object.lastModified;
      }
      if (!current.maxLastModified || object.lastModified > current.maxLastModified) {
        current.maxLastModified = object.lastModified;
      }
    }
    if (current.sampleKeys.length < 5) {
      current.sampleKeys.push(object.key);
    }
    map.set(object.topLevelPrefix, current);
  }

  return Array.from(map.entries())
    .map(([prefix, value]) => ({ prefix, ...value }))
    .sort((a, b) => b.totalBytes - a.totalBytes);
}
