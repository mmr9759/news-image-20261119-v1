# THE WORLD TODAY — 19 November 2026

[![news-image-20261119](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/c/news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/mmr9759/news-image-20261119-v1/rank.svg)](https://make.fun/c/news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/mmr9759/news-image-20261119-v1/reward.svg)](https://make.fun/c/news-image-20261119)

A front-page newspaper image summing up the world's news of **Thursday 19 November 2026** — 42 real stories from six continents, drawn by a small deterministic TypeScript program.

Lead stories: the worldwide launch of GTA VI, the Trump–Xi–Putin handshake at the Shenzhen summit, and Anthropic's record $81.3bn IPO. Below them a dotted world map and 39 numbered briefs, from Voyager 1's one-light-day milestone to Cyclone Akvan, the SAFF Championship, and a record $190.4m Van Gogh sale.

## Entry

`main.ts` (Node 22, standard library only) draws the page with a built-in 5×7 bitmap font and its own tiny PNG encoder, and writes `entry.png` (1024×1024, under 1 MiB) to the output directory. No network, no clock, no randomness — the same bytes on every run.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Competition: [news-image-20261119 on make.fun](https://make.fun/c/news-image-20261119)

## License

MIT — see [LICENSE](LICENSE).
