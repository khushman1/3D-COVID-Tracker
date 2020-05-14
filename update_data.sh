#! /bin/bash
git subtree pull --prefix csse_data https://github.com/CSSEGISandData/COVID-19.git  master --squash
python getLatestJsonFromData.py
python generateLabels.py
python generateGraphs.py
trimage -d ./images/
git add parsed_data_timeseries.json images/
git commit -m "Updated data"
npm run build
git push
