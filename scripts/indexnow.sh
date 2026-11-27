#!/bin/sh
# Tell Bing, Yandex, Seznam and Naver (IndexNow) that AdSure pages changed.
# Bing's index feeds ChatGPT search and Copilot, so run this after each deploy that changes page text:
#   sh scripts/indexnow.sh                 (sends every page in sitemap.xml)
#   sh scripts/indexnow.sh /pricing /faq   (sends only these pages)
KEY=c88eae364b874eb29a614651f4d0e49f
HOST=www.adsure.in
if [ "$#" -gt 0 ]; then
  URLS=$(for p in "$@"; do printf '"https://%s%s",' "$HOST" "$p"; done)
else
  URLS=$(curl -s "https://$HOST/sitemap.xml" | grep -o '<loc>https://www.adsure.in[^<]*</loc>' | sed 's/<[^>]*>//g' | sed 's/.*/"&",/' | tr -d '\n')
fi
URLS=${URLS%,}
curl -s -o /dev/null -w "IndexNow answered %{http_code} (200 or 202 = accepted)\n" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{\"host\":\"$HOST\",\"key\":\"$KEY\",\"keyLocation\":\"https://$HOST/$KEY.txt\",\"urlList\":[$URLS]}" \
  https://api.indexnow.org/indexnow
