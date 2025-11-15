import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Article } from '../types';

// Helper function to read articles from file system
function readArticlesFromFileSystem(): Article[] {
  try {
    const articlesDir = path.join(process.cwd(), '../../content/articles/published');
    const fileNames = fs.readdirSync(articlesDir).filter(name => name.endsWith('.md'));
    
    const articles = fileNames.map((fileName) => {
      const fullPath = path.join(articlesDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      
      const slug = fileName.replace(/\.md$/, '');
      
      return {
        slug,
        title: data.title || 'Untitled',
        date: data.date || '',
        content: content,
        image: data.image || '',
        publication: data.publication || data.source || '',
        location: data.location || '',
        source: data.source || '',
        tags: data.tags || [],
        categories: data.categories || [],
        people: data.people || [],
        events: data.events || [],
      };
    });
    
    return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error reading articles from file system:', error);
    return [];
  }
}

// Get all articles - uses file system for SSG/SSR
export async function getAllArticles(): Promise<Article[]> {
  // During build time and server-side rendering, read from file system
  if (typeof window === 'undefined') {
    return readArticlesFromFileSystem();
  }
  
  // On client-side, fetch from API
  try {
    const response = await fetch('/api/articles', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch articles');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

// Get article by slug - uses file system for SSG/SSR
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  // During build time and server-side rendering, read from file system
  if (typeof window === 'undefined') {
    const articles = readArticlesFromFileSystem();
    return articles.find(article => article.slug === slug) || null;
  }
  
  // On client-side, fetch from API
  try {
    const response = await fetch(`/api/articles/${slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch article');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function searchArticles(query: string): Promise<Article[]> {
  const allArticles = await getAllArticles();
  const searchTerm = query.toLowerCase();
  
  return allArticles.filter(article => 
    article.title.toLowerCase().includes(searchTerm) ||
    article.content.toLowerCase().includes(searchTerm) ||
    (article.publication && article.publication.toLowerCase().includes(searchTerm)) ||
    (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
  );
}

export async function getArticlesByDateRange(startDate: string, endDate: string): Promise<Article[]> {
  const allArticles = await getAllArticles();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return allArticles.filter(article => {
    if (!article.date) return false;
    const articleDate = new Date(article.date);
    return articleDate >= start && articleDate <= end;
  });
}

export async function getArticlesByTag(tag: string): Promise<Article[]> {
  const allArticles = await getAllArticles();
  return allArticles.filter(article => 
    article.tags && article.tags.includes(tag)
  );
}

export async function getArticlesByNewspaper(newspaper: string): Promise<Article[]> {
  const allArticles = await getAllArticles();
  return allArticles.filter(article => 
    article.publication && article.publication.toLowerCase() === newspaper.toLowerCase()
  );
}

export async function getFeaturedArticles(limit: number = 6): Promise<Article[]> {
  const allArticles = await getAllArticles();
  // Return articles that have image or are particularly interesting
  return allArticles
    .filter(article => article.image) // Prioritize articles with images
    .slice(0, limit);
}

export async function getArticleStats() {
  const articles = await getAllArticles();
  
  const publications = new Set<string>();
  const locations = new Set<string>();
  const people = new Set<string>();
  const tags = new Set<string>();
  
  articles.forEach(article => {
    if (article.publication) publications.add(article.publication);
    if (article.location) locations.add(article.location);
    if (article.people) article.people.forEach(person => people.add(person));
    if (article.tags) article.tags.forEach(tag => tags.add(tag));
  });
  
  return {
    totalArticles: articles.length,
    publications: Array.from(publications),
    locations: Array.from(locations),
    people: Array.from(people),
    tags: Array.from(tags),
    dateRange: {
      earliest: articles[articles.length - 1]?.date || '',
      latest: articles[0]?.date || ''
    }
  };
}