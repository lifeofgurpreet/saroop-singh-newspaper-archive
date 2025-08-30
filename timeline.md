---
layout: default
title: Timeline
permalink: /timeline/
---

# Timeline of Articles

Browse the complete archive organized chronologically by year.

{% assign sorted_articles = site.pages | where_exp: "page", "page.path contains 'output/articles'" | sort: "date" %}
{% assign articles_by_year = sorted_articles | group_by_exp: "article", "article.date | date: '%Y'" %}

<div class="timeline">
{% for year_group in articles_by_year %}
    <div class="timeline-year">{{ year_group.name | default: "Unknown Year" }}</div>
    <div class="timeline-items">
        {% for article in year_group.items %}
        <div class="timeline-item">
            <h4><a href="{{ site.baseurl }}{{ article.url | replace: '.md', '' }}" style="color: var(--primary); text-decoration: none;">{{ article.title }}</a></h4>
            <p style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.5rem;">
                <strong>{{ article.date_text | default: article.date | date: "%B %d" | default: "Date unknown" }}</strong><br>
                {{ article.source | default: "Unknown source" }}
                {% if article.location %} • {{ article.location }}{% endif %}
            </p>
            {% if article.people and article.people.size > 0 %}
            <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.5rem;">
                <em>People: {{ article.people | join: ", " | truncate: 100 }}</em>
            </p>
            {% endif %}
        </div>
        {% endfor %}
    </div>
{% endfor %}
</div>

<style>
    .timeline {
        margin-top: 2rem;
    }
    
    .timeline-year {
        position: sticky;
        top: 60px;
        z-index: 10;
        backdrop-filter: blur(10px);
    }
    
    @media (max-width: 768px) {
        .timeline-items {
            padding-left: 1rem;
        }
    }
</style>