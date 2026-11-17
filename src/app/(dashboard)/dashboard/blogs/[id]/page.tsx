import { EditBlogPostPage } from '@/features/blog/components/EditBlogPostPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditBlogPostPage id={id} />;
}
