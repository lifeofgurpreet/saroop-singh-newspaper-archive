---
layout: home
title: Home
---

# Welcome to the Saroop Singh Archive

<div class="stats-grid">
    <div class="stat-card">
        <h3>{{ site.pages | where_exp: "page", "page.path contains 'output/articles'" | size }}</h3>
        <p>Digitized Articles</p>
    </div>
    <div class="stat-card">
        <h3>17</h3>
        <p>Years Covered</p>
    </div>
    <div class="stat-card">
        <h3>8+</h3>
        <p>Newspaper Sources</p>
    </div>
</div>

## About This Archive

This digital archive preserves historical newspaper clippings documenting athletic meets in colonial Malaya from 1937 to 1954. The collection focuses on **Saroop Singh**, a prominent runner of the era, and his contemporaries in the Malayan athletic scene.

Each article has been carefully digitized from original newspaper clippings, with faithful transcriptions maintaining historical accuracy while making the content searchable and accessible for researchers, historians, and athletics enthusiasts.

## Featured Content

### Recent Additions
{% assign recent_articles = site.pages | where_exp: "page", "page.path contains 'output/articles'" | sort: "date" | reverse | limit: 5 %}
<div class="timeline">
    <div class="timeline-items">
        {% for article in recent_articles %}
        <div class="timeline-item">
            <h4><a href="{{ site.baseurl }}{{ article.url | replace: '.md', '' }}" style="color: var(--primary); text-decoration: none;">{{ article.title }}</a></h4>
            <p style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.5rem;">
                {{ article.date_text | default: article.date | default: "Date unknown" }} • {{ article.source | default: "Unknown source" }}
            </p>
        </div>
        {% endfor %}
    </div>
</div>

## Navigate the Archive

Use the **sidebar search** to find specific articles by title, source, or people mentioned. On mobile devices, tap the menu icon to access the search and article list.

### Quick Links
- [View Timeline →]({{ site.baseurl }}/timeline)
- [About the Project →]({{ site.baseurl }}/about)
- [GitHub Repository →](https://github.com/lifeofgurpreet/saroop-singh-newspaper-archive)

## Historical Context

The articles in this archive capture a pivotal period in Malayan athletics, documenting:
- Track and field championships
- Inter-state athletic competitions  
- Cross-country races
- School and club sports meets
- The emergence of local athletic talent

These records provide valuable insights into the sporting culture of pre-independence Malaya and the athletes who competed during this era.

---

*This archive is continuously growing as more historical materials are digitized and transcribed.*