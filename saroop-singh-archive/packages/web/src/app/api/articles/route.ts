import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Article } from '@/types';

const articlesDirectory = path.join(process.cwd(), '../../content/articles/published');

function getAllArticlesFromFS(): Article[] {
  try {
    const fileNames = fs.readdirSync(articlesDirectory);
    
    const articles: Article[] = fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => {
        const fullPath = path.join(articlesDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);
        
        const slug = fileName.replace(/\.md$/, '');
        
        return {
          slug,
          title: data.title || 'Untitled',
          date: data.date,
          date_text: data.date_text,
          source: data.source,
          publication: data.publication || data.newspaper,
          page: data.page,
          location: data.location,
          people: data.people || [],
          events: data.events || [],
          category: data.category,
          tags: data.tags || [],
          image: data.image || data.image_url,
          content,
        };
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    
    return articles;
  } catch (error) {
    console.error('Error reading articles:', error);
    return [];
  }
}

export async function GET() {
  try {
    const articles = getAllArticlesFromFS();
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}