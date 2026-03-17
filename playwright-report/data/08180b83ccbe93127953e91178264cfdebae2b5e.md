# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - link "ГдеСейчас" [ref=e5] [cursor=pointer]:
          - /url: /
        - button "Санкт-Петербург" [ref=e7] [cursor=pointer]:
          - img [ref=e8]
          - generic [ref=e11]: Санкт-Петербург
          - img [ref=e12]
      - navigation [ref=e14]:
        - link "Скидки" [ref=e15] [cursor=pointer]:
          - /url: /offers
        - link "Карта" [ref=e16] [cursor=pointer]:
          - /url: /map
        - link "Поиск" [ref=e17] [cursor=pointer]:
          - /url: /search
        - link "Избранное" [ref=e18] [cursor=pointer]:
          - /url: /favorites
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e33] [cursor=pointer]:
    - img [ref=e34]
  - alert [ref=e37]
```