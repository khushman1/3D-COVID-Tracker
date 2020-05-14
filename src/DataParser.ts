import * as data from "../parsed_data_timeseries.json";
import * as stateMapping from "../census_data.json";

export class DataParser {

    constructor() {
    }

    static getAllData() {
        return Object(data).default;
    }

    static getCountryData() {
        return Object(data).default;
    }

    static getRegionData(regionName : string) {
        return (data.children as any)[regionName];
    }

    static getStateData(state : string) {
        let region = this.getRegionFromState(state);
        if (region) {
            return (data.children as any)[region]["children"][state];
        }
        return undefined;
    }

    static getRegionFromState(state : string) {
        for(let allRegions of Object.values(stateMapping)) {
            for(let region of Object.keys(allRegions)) {
                if ((allRegions as any)[region].includes(state)) {
                    return region;
                }
            }
        }
        return undefined;
    }

    static getCountyData(state : string, county : string) {
        let stateData = this.getStateData(state);
        if (stateData) {
            return stateData["children"][county];
        }
        return undefined;
    }

    static getAncestor(input : string, roots? : any) : any {
        if (roots == undefined) roots = [DataParser.getCountryData()];
        if (input == "US") return undefined;
        let newRoots : any = {};
        for (let root of Object.values<any>(roots)) {
            if (root["children"] != null) {
                for(let key of Object.keys(root["children"])) {
                    if (key == input) {
                        return root;
                    }
                    newRoots[key] = root["children"][key];
                }
            }
        }
        if (Object.keys(newRoots).length < 1) return undefined;
        return DataParser.getAncestor(input, newRoots);
    }
}