import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Article } from '@/types';

const articlesDirectory = path.join(process.cwd(), '../../content/articles/published');

function getArticleBySlugFromFS(slug: string): Article | null {
  try {
    const fullPath = path.join(articlesDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
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
  } catch (error) {
    console.error('Error reading article:', error);
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const article = getArticleBySlugFromFS(slug);
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}