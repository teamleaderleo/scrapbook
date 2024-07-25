import { deleteFromS3 } from '../external/s3-operations';

export class S3ResourceTracker {
  private resources: string[] = [];

  addResource(url: string) {
    this.resources.push(url);
  }

  async cleanup() {
    for (const url of this.resources) {
      try {
        await deleteFromS3(url);
      } catch (error) {
        console.error(`Failed to delete resource: ${url}`, error);
      }
    }
    this.resources = []; // Clear the resources after cleanup
  }
}