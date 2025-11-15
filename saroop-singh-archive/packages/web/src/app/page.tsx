import { getFeaturedArticles } from '@/lib/articles';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ResponsiveContainer, ContentContainer } from '@/components/layout/responsivecontainer';
import { GridLayout } from '@/components/layout/gridlayout';
import { VStack } from '@/components/layout/flexlayout';
import { MobileArticleCard } from '@/components/mobile/mobilearticlecard';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, FileText, Images, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Saroop Singh Archive | Malaysian Athletics Pioneer',
  description: 'Preserving the legacy of Saroop Singh, a pioneering Sikh athlete who made significant contributions to Malaysian athletics in the 1930s and 1940s.',
  openGraph: {
    title: 'Saroop Singh Archive',
    description: 'Preserving the legacy of a Malaysian athletics pioneer',
    type: 'website',
  },
};

export default async function HomePage() {
  const featuredArticles = await getFeaturedArticles(6);
  
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section - Sophisticated Modern Design */}
      <section className="relative bg-gradient-to-br from-neutral-50 via-white to-primary-50/20 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-accent-100/20 via-transparent to-transparent" />
        
        <ResponsiveContainer className="relative py-16 sm:py-20 lg:py-28">
          <VStack gap="lg" align="center" className="text-center">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100/50 backdrop-blur-sm rounded-full border border-primary-200/50">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary-700">Preserving Historical Legacy</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
              <span className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 bg-clip-text text-transparent">
                Saroop Singh
              </span>
              <span className="block mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                Archive
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-neutral-600 max-w-3xl leading-relaxed">
              Discover the extraordinary journey of Malaysia&apos;s pioneering Sikh athlete
              through meticulously preserved historical records and restored photographs
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild size="lg" className="group">
                <Link href="/articles">
                  Explore Archive
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/timeline">
                  View Timeline
                </Link>
              </Button>
              <Button asChild variant="premium" size="lg">
                <Link href="/restore">
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI Photo Restoration
                </Link>
              </Button>
            </div>
          </VStack>
        </ResponsiveContainer>
      </section>
      
      {/* About Section with Elegant Design */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-neutral-50">
        <ContentContainer>
          <VStack gap="xl" className="text-center">
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                About Saroop Singh
              </h2>
              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
                Saroop Singh was a pioneering Sikh athlete who made significant contributions to Malaysian athletics 
                in the 1930s and 1940s. This digital archive preserves newspaper clippings, photographs, and historical 
                records documenting his extraordinary athletic achievements and lasting impact on Malaysian sports.
              </p>
            </div>
            
            {/* Feature Cards - Sophisticated Modern Grid */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Historical Articles Card */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-sm border border-neutral-200/60 hover:shadow-xl hover:border-primary-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Historical Articles</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Browse through digitized newspaper clippings chronicling Saroop Singh&apos;s athletic career 
                    and achievements from the 1930s and 1940s.
                  </p>
                  <Link 
                    href="/articles"
                    className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors group/link"
                  >
                    Explore Articles
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
              
              {/* Timeline Card */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-sm border border-neutral-200/60 hover:shadow-xl hover:border-primary-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Timeline</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Follow the chronological journey of Saroop Singh&apos;s athletic career through key 
                    milestones and achievements in Malaysian sports history.
                  </p>
                  <Link 
                    href="/timeline"
                    className="inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700 transition-colors group/link"
                  >
                    View Timeline
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
              
              {/* Photo Restoration Card */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-sm border border-neutral-200/60 hover:shadow-xl hover:border-accent-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-500/20">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Photo Restoration</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Bring old photographs back to life using AI-powered restoration technology.
                    Upload your historical photos and get multiple restoration styles.
                  </p>
                  <Link 
                    href="/restore"
                    className="inline-flex items-center text-accent-600 font-semibold hover:text-accent-700 transition-colors group/link"
                  >
                    Restore Photos
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
              
              {/* Gallery Card */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-sm border border-neutral-200/60 hover:shadow-xl hover:border-primary-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <Images className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Restoration Gallery</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Browse through a collection of AI-restored historical photographs shared by the community.
                    Discover enhanced memories from the past.
                  </p>
                  <Link 
                    href="/gallery"
                    className="inline-flex items-center text-rose-600 font-semibold hover:text-rose-700 transition-colors group/link"
                  >
                    View Gallery
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </VStack>
        </ContentContainer>
      </section>

      {/* Featured Articles Section - Elegant Design */}
      {featuredArticles.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-neutral-50 to-white">
          <ContentContainer>
            <VStack gap="xl">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 bg-clip-text text-transparent mb-6">Featured Articles</h2>
                <p className="text-lg text-neutral-600">
                  Discover key moments in Saroop Singh&apos;s athletic journey through these carefully selected historical articles.
                </p>
              </div>
              
              <Suspense fallback={
                <GridLayout cols={{ default: 1, sm: 2, lg: 3 }} className="animate-pulse">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="bg-white rounded-xl h-64 border border-gray-200" />
                  ))}
                </GridLayout>
              }>
                <GridLayout cols={{ default: 1, sm: 2, lg: 3 }} gap="lg">
                  {featuredArticles.map((article) => (
                    <MobileArticleCard
                      key={article.slug}
                      article={article}
                      variant="default"
                      showImage={true}
                    />
                  ))}
                </GridLayout>
              </Suspense>
              
              <div className="text-center pt-8">
                <Button asChild size="lg" className="group">
                  <Link href="/articles">
                    View All Articles
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </VStack>
          </ContentContainer>
        </section>
      )}
    </div>
  );
}

export const revalidate = 1800; // Revalidate every 30 minutes
