export const data = {
  "key": "v-ee84d222",
  "path": "/guide/20.html",
  "title": "20 | async/await：使用同步的方式去写异步代码",
  "lang": "zh-CN",
  "frontmatter": {
    "lang": "zh-CN",
    "title": "20 | async/await：使用同步的方式去写异步代码"
  },
  "excerpt": "",
  "headers": [
    {
      "level": 2,
      "title": "生成器 VS 协程",
      "slug": "生成器-vs-协程",
      "children": []
    },
    {
      "level": 2,
      "title": "async/await",
      "slug": "async-await",
      "children": [
        {
          "level": 3,
          "title": "1. async",
          "slug": "_1-async",
          "children": []
        },
        {
          "level": 3,
          "title": "2. await",
          "slug": "_2-await",
          "children": []
        }
      ]
    },
    {
      "level": 2,
      "title": "总结",
      "slug": "总结",
      "children": []
    },
    {
      "level": 2,
      "title": "思考时间",
      "slug": "思考时间",
      "children": []
    }
  ],
  "git": {},
  "filePathRelative": "guide/20.md"
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
