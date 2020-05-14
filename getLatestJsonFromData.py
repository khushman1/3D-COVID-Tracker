import json
import csv
import subprocess
import datetime

subfolder = "csse_data/csse_covid_19_data/csse_covid_19_daily_reports/"
output_filename = "parsed_data_timeseries.json"

confirmed_time_series_filename = "csse_data/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv"
deaths_time_series_filename = "csse_data/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv"
# files = subprocess.run(["ls", "-t", subfolder], capture_output=True).stdout.decode("utf-8").split("\n")
# filename = next((_file for _file in files if "csv" in _file), None)
# print(filename, "parsing")
data = None

def getDataFromConfirmedTimeSeriesCSV(filename):
    data = {}
    dates = None
    if filename:
        with open(filename) as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                if row[7] == "US" and row[8] != '0.0' and row[9] != '0.0' and row[5] != 'Unassigned' and row[8] != '':
                    data[row[10]] = [row[5], row[6], row[7], row[8], row[9], row[11:]]
                elif row[0] == "UID":
                    objdates = [(datetime.datetime(2020, int(i.split('/')[0]), int(i.split('/')[1]))) for i in row[11:]]
                    dates = list(map(lambda x: x.strftime("%Y-%m-%d"), objdates))
    return data, dates

def getDataFromDeathsTimeSeriesCSV(filename):
    data = {}
    if filename:
        with open(filename) as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                if row[7] == "US" and row[8] != '0.0' and row[9] != '0.0' and row[5] != 'unassigned':
                    data[row[10]] = row[12:]
    return data

def getCensusRegions():
    return {"Northeast": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania"],
            "Midwest": ["Illinois", "Indiana", "Michigan", "Ohio", "Wisconsin", "Iowa", "Kansas", "Minnesota", "Missouri", "Nebraska", "North Dakota", "South Dakota"],
            "South": ["Delaware", "Florida", "Georgia", "Maryland", "North Carolina", "South Carolina", "Virginia", "District of Columbia", "West Virginia", "Alabama", "Kentucky", "Mississippi", "Tennessee", "Arkansas", "Louisiana", "Oklahoma", "Texas"],
            "West": ["Arizona", "Colorado", "Idaho", "Montana", "Nevada", "New Mexico", "Utah", "Wyoming", "Alaska", "California", "Hawaii", "Oregon", "Washington"]}

def mergeConfirmedDeaths(confirmed_data, deaths_data):
    for key, value in confirmed_data.items():
        confirmed_data[key].append(deaths_data[key])

if confirmed_time_series_filename:
    confirmed_data, dates = getDataFromConfirmedTimeSeriesCSV(confirmed_time_series_filename)
    deaths_data = getDataFromDeathsTimeSeriesCSV(deaths_time_series_filename)
    mergeConfirmedDeaths(confirmed_data, deaths_data)

data = confirmed_data
census_regions = getCensusRegions()

def templateFactory(length):
    template = {"name": "", "lat": 0.0, "lon": 0.0, "full_name": ""}
    template["series_confirmed"] = [0] * length
    template["series_active"] = [0] * length
    template["series_deaths"] = [0] * length
    template["dates"] = dates
    template["children"] = dict()
    return template

countryData = templateFactory(len(dates))
countryData["name"] = "US"
countryData["full_name"] = "US"
for key, row in data.items():
    county = row[0]
    state = row[1]
    country = row[2]
    lat = float(row[3])
    lon = float(row[4])
    confirmed = list(map(int, row[5]))
    deaths = list(map(int, row[6]))
    active = [confirmed[i] - deaths[i] for i in range(len(confirmed))]
    currRegion = None
    for region, states in census_regions.items():
        if state in states:
            currRegion = region
            break
    if not currRegion:
        #print("FALSE STATE!!", state)
        continue

    # Create county node
    countyData = templateFactory(len(dates))
    countyData["name"] = county
    countyData["series_confirmed"] = confirmed
    countyData["series_deaths"] = deaths
    countyData["series_active"] = active
    countyData["lat"] = lat
    countyData["lon"] = lon
    countyData["full_name"] = key

    # Fetch region information
    regionData = None
    if currRegion in countryData["children"]:
        regionData = countryData["children"][currRegion]
    else:
        regionData = templateFactory(len(dates))
        regionData["name"] = currRegion
        regionData["full_name"] = f"{currRegion}, US"
        countryData["children"][currRegion] = regionData

    regionData["series_confirmed"] = [regionData["series_confirmed"][i] + confirmed[i] for i in range(len(confirmed))]
    regionData["series_deaths"] = [regionData["series_deaths"][i] + deaths[i] for i in range(len(deaths))]
    regionData["series_active"] = [regionData["series_active"][i] + active[i] for i in range(len(active))]
    regionData["lat"] += lat
    regionData["lon"] += lon

    # Fetch state information
    stateData = None
    if state in regionData["children"]:
        stateData = regionData["children"][state]
    else:
        stateData = templateFactory(len(dates))
        stateData["name"] = state
        stateData["full_name"] = f"{state}, {currRegion}, US"
        regionData["children"][state] = stateData

    stateData["series_confirmed"] = [stateData["series_confirmed"][i] + confirmed[i] for i in range(len(confirmed))]
    stateData["series_deaths"] = [stateData["series_deaths"][i] + deaths[i] for i in range(len(deaths))]
    stateData["series_active"] = [stateData["series_active"][i] + active[i] for i in range(len(active))]
    stateData["lat"] += lat
    stateData["lon"] += lon

    stateData["children"][county] = countyData

    countryData["series_confirmed"] = [countryData["series_confirmed"][i] + confirmed[i] for i in range(len(confirmed))]
    countryData["series_deaths"] = [countryData["series_deaths"][i] + deaths[i] for i in range(len(deaths))]
    countryData["series_active"] = [countryData["series_active"][i] + active[i] for i in range(len(active))]
    countryData["lat"] += lat
    countryData["lon"] += lon

countryCounties = 0
# Take a mean of all the lat lon for an approx center
for region in census_regions:
    regionData = countryData["children"][region]
    counties = 0
    for data in regionData["children"].values():
        data["lat"] /= len(data["children"])
        data["lon"] /= len(data["children"])
        counties += len(data["children"])
    regionData["lat"] /= counties 
    regionData["lon"] /= counties
    countryCounties += counties
countryData["lat"] /= countryCounties
countryData["lon"] /= countryCounties

with open(output_filename, 'w') as outfile:
    json.dump(countryData, outfile)
with open("census_data.json", 'w') as outfile:
    json.dump(census_regions, outfile)
