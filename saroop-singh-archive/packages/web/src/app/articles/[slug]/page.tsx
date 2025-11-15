import { getArticleBySlug, getAllArticles } from '@/lib/articles';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found | Saroop Singh Archive',
    };
  }

  return {
    title: `${article.title} | Saroop Singh Archive`,
    description: article.content.slice(0, 160),
    openGraph: {
      title: article.title,
      description: article.content.slice(0, 160),
      images: article.image ? [{ url: article.image }] : [],
    },
  };
}

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-8">
          <Link 
            href="/articles" 
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Articles
          </Link>
        </nav>

        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              {article.date && (
                <time dateTime={article.date}>
                  {article.date_text || new Date(article.date).toLocaleDateString()}
                </time>
              )}
              {article.publication && (
                <span>Source: {article.publication}</span>
              )}
              {article.location && (
                <span>Location: {article.location}</span>
              )}
              {article.page && (
                <span>Page: {article.page}</span>
              )}
            </div>

            {article.image && (
              <div className="mb-8">
                <div className="relative w-full max-w-2xl mx-auto rounded-lg shadow-lg overflow-hidden aspect-[16/9]">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {article.people && article.people.length > 0 && (
            <footer className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">People Mentioned</h3>
              <div className="flex flex-wrap gap-2">
                {article.people.map((person) => (
                  <span
                    key={person}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                  >
                    {person}
                  </span>
                ))}
              </div>
            </footer>
          )}

          {article.events && article.events.length > 0 && (
            <section className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Events</h3>
              <div className="flex flex-wrap gap-2">
                {article.events.map((event) => (
                  <span
                    key={event}
                    className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </div>
  );
}

export const revalidate = 3600; // Revalidate every hour