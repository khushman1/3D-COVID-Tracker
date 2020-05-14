# 3D-COVID-Tracker

## Setup

Run `npm install` in the root directory

### Update Data

To update the data, run `update_data.sh`.
Updating data includes building the project again(as the json files are loaded as modules) and pushing it to the repository.

### To generate graphs and labels

We use python to generate the graphs and labels. The necessary libraries for the same are `numpy, seaborn, pandas, matplotlib, pillow`.
We use `trimage` to optimize the generated images. To remove this step, you can remove the line from `update_data.sh`.

## Run

You can either build the project using `npm run build` or start a development server with `npm run start`.

A live version of the project can be accessed at 
