import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { resources } from './schema.ts';

export interface ResourceWriteInput {
  itemType: string;
  title: string;
  description: string;
  category: string;
  pricing: string;
  tags: string[];
  url: string | null;
  content: string | null;
  isPublic: boolean;
  userId?: number | null;
}

// Public query: strictly filters to rows where is_public = true so private notes never leak.
export async function getPublicResources() {
  try {
    return await db
      .select()
      .from(resources)
      .where(eq(resources.isPublic, true))
      .orderBy(desc(resources.createdAt), desc(resources.id));
  } catch (error) {
    console.error('Database query failed (getPublicResources):', error);
    throw new Error('Failed to load public resources.', { cause: error });
  }
}

// Admin query: returns both public and private resources for the authenticated curator.
export async function getAllResourcesForAdmin() {
  try {
    return await db
      .select()
      .from(resources)
      .orderBy(desc(resources.createdAt), desc(resources.id));
  } catch (error) {
    console.error('Database query failed (getAllResourcesForAdmin):', error);
    throw new Error('Failed to load resources.', { cause: error });
  }
}

export async function createResource(input: ResourceWriteInput) {
  try {
    const [created] = await db
      .insert(resources)
      .values({
        itemType: input.itemType,
        title: input.title,
        description: input.description,
        category: input.category,
        pricing: input.pricing,
        tags: input.tags,
        url: input.url,
        content: input.content,
        isPublic: input.isPublic,
        userId: input.userId ?? null,
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Database insert failed (createResource):', error);
    throw new Error('Failed to save resource.', { cause: error });
  }
}

export async function updateResource(id: number, input: Partial<ResourceWriteInput>) {
  try {
    const [updated] = await db
      .update(resources)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(resources.id, id))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('Database update failed (updateResource):', error);
    throw new Error('Failed to update resource.', { cause: error });
  }
}

export async function deleteResource(id: number) {
  try {
    const [deleted] = await db
      .delete(resources)
      .where(eq(resources.id, id))
      .returning();

    return deleted ?? null;
  } catch (error) {
    console.error('Database delete failed (deleteResource):', error);
    throw new Error('Failed to delete resource.', { cause: error });
  }
}
