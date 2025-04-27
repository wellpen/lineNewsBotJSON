function flexCarouselTemplate(newsList) {
    return {
        type: "flex",
        altText: "📰 今日新聞",
        contents: {
            type: "carousel",
            contents: newsList.map(item => ({
                type: "bubble",
                size: "mega",
                styles: {
                    body: {
                        backgroundColor: "#F5F5F5"
                    }
                },
                hero: {
                    type: "image",
                    url: "https://fakeimg.pl/600x400/?text=News&font=lobster",
                    size: "full",
                    aspectRatio: "16:9",
                    aspectMode: "cover"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: item.title,
                                    weight: "bold",
                                    size: "lg",
                                    wrap: true,
                                    maxLines: 3
                                }
                            ],
                            height: "100px" // ✅ 標題區固定高度
                        },
                        {
                            type: "button",
                            action: {
                                type: "uri",
                                label: "🔗 查看新聞",
                                uri: item.link
                            },
                            style: "primary",
                            margin: "md"
                        }
                    ]
                }
            }))
        }
    };
}
