import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd
from pandas.plotting import register_matplotlib_converters

import datetime as dt
import json

register_matplotlib_converters()
dates = None
a4_dims = (11.7, 8.27)
done = set()

def setSNS():
    sns.set()
    sns.set_context('poster')
    sns.set(rc={'figure.figsize':a4_dims})

def setGraphParameters(g, y, log = False):
    g.set(xticks=dates[::8])
    g.fig.autofmt_xdate()
    if log:
        g.set(yscale="log")

def savePlot(x, y, df, data):
    setSNS()
    g = sns.relplot(x=x, y=y, kind="line", data=df)
    plt.stem(df[x][::8], df[y][::8], linefmt='C0--', use_line_collection=True)
    log = True if df[y][len(df[y]) - 1] > 100000 else False
    setGraphParameters(g, y, log)
    g.fig.savefig(f'./images/graphs/{y}_{data["full_name"]}.png', dpi=400)
    plt.close(g.fig)

def plots(df, data):
    savePlot("Days", "Confirmed", df, data)
    savePlot("Days", "Deaths", df, data)
    savePlot("Days", "Active", df, data)
    return f'Saved {data["full_name"]}.png'

def generateSubTreeGraphs(data):
    global dates, done
    if dates == None:
        dates = [dt.datetime.strptime(i, "%Y-%m-%d") for i in data["dates"]]
    if data["full_name"] not in done:
        done.add(data["full_name"])
        df = pd.DataFrame(dict(Days = dates,
                          Confirmed=data["series_confirmed"],
                          Deaths=data["series_deaths"],
                          Active=[data["series_confirmed"][i] - data["series_deaths"][i] for i in range(len(data["series_confirmed"]))]))
        print(plots(df, data))
    if data["children"]:
        for children in data["children"].values():
            generateSubTreeGraphs(children)


with open('parsed_data_timeseries.json', 'r') as f:
    data = json.loads(f.read())

generateSubTreeGraphs(data)
