---
layout: default
title: All Articles
permalink: /articles/
---

# All Articles

Browse the complete collection of digitized newspaper clippings, organized chronologically.

<style>
    .articles-list {
        list-style: none;
        padding: 0;
    }
    .article-item {
        padding: 15px;
        margin-bottom: 15px;
        background: #f8f8f8;
        border-left: 3px solid #2c3e50;
        transition: all 0.3s ease;
    }
    .article-item:hover {
        background: #f0f0f0;
        border-left-width: 5px;
    }
    .article-item h3 {
        margin: 0 0 10px 0;
        font-size: 1.2em;
    }
    .article-item a {
        color: #2c3e50;
        text-decoration: none;
    }
    .article-item a:hover {
        text-decoration: underline;
    }
    .article-meta {
        color: #666;
        font-size: 0.9em;
    }
    .year-section {
        margin: 30px 0;
    }
    .year-header {
        background: #2c3e50;
        color: white;
        padding: 10px 15px;
        margin: 20px 0 10px 0;
        font-size: 1.3em;
    }
</style>

{% assign sorted_articles = site.pages | where_exp: "page", "page.path contains 'output/articles'" | sort: "date" %}
{% assign articles_by_year = sorted_articles | group_by_exp: "article", "article.date | date: '%Y'" %}

{% for year_group in articles_by_year %}
<div class="year-section">
    <h2 class="year-header">{{ year_group.name }}</h2>
    <ul class="articles-list">
        {% for article in year_group.items %}
        <li class="article-item">
            <h3><a href="{{ site.baseurl }}{{ article.url | replace: '.md', '' }}">{{ article.title }}</a></h3>
            <div class="article-meta">
                {% if article.date_text %}
                    <strong>Date:</strong> {{ article.date_text }} | 
                {% elsif article.date %}
                    <strong>Date:</strong> {{ article.date | date: "%B %d, %Y" }} | 
                {% endif %}
                {% if article.source %}
                    <strong>Source:</strong> {{ article.source }}
                {% endif %}
                {% if article.location %}
                     | <strong>Location:</strong> {{ article.location }}
                {% endif %}
            </div>
        </li>
        {% endfor %}
    </ul>
</div>
{% endfor %}

{% if sorted_articles.size == 0 %}
<p><em>No articles have been added yet.</em></p>
{% endif %}