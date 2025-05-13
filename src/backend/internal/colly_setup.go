c := colly.NewCollector(
    colly.AllowedDomains("quilliumtest.com", "quilliumexample.com"),
    colly.MaxDepth(3),
    colly.Async(true),
    colly.UserAgent(randomUserAgent()),
)

c.OnHTML("body", func(e *colly.HTMLElement) {
    title := e.DOM.Find("title").Text()
    snippet := e.DOM.Find("p").First().Text()
    images := []string{}
    e.DOM.Find("img").Each(func(_ int, img *goquery.Selection) {
        src, _ := img.Attr("src")
        images = append(images, e.Request.AbsoluteURL(src))
    })

    data := PageData{
        URL:     e.Request.URL.String(),
        Title:   title,
        Snippet: snippet,
        Images:  images,
    }

    sendToIndexer(data)
})