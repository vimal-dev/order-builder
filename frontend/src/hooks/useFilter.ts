import React, {useEffect, useState} from "react";
import {useAuthenticatedAxios} from "./useAxios";
import {get as _get, omit as _omit} from "lodash";
import moment from "moment";

export enum FilterStringOperators {
    EQUAL_TO = "eq",
    NOT_EQUAL_TO = "ne",
    IS_EMPTY = "is_empty",
    IS_NOT_EMPTY = "is_not_empty",
    CONTAINS = "contains",
    STARTS_WITH = "starts_with",
    ENDS_WITH = "ends_with",
    INCLUDES = "includes",
    NOT_INCLUDES = "not_includes"
}

export enum FilterNumberOperators {
    EQUAL_TO = "eq",
    NOT_EQUAL_TO = "ne",
    IS_EMPTY = "is_empty",
    IS_NOT_EMPTY = "is_not_empty",
    LESS_THAN = "lt",
    LESS_THAN_EQUAL = "lte",
    GREATER_THAN = "gt",
    GREATER_THAN_EQUAL = "gte",
    BETWEEN = "between",
    NOT_BETWEEN = "not_between",
    INCLUDES = "includes",
    NOT_INCLUDES = "not_includes"
}

export enum FilterBooleanOperators {
    TOGGLE = "toggle",
    IS_EMPTY = "is_empty",
    IS_NOT_EMPTY = "is_not_empty"
}

export enum FilterDatetimeOperators {
    EQUAL_TO = "eq",
    NOT_EQUAL_TO = "ne",
    IS_EMPTY = "is_empty",
    IS_NOT_EMPTY = "is_not_empty",
    LESS_THAN = "lt",
    LESS_THAN_EQUAL = "lte",
    GREATER_THAN = "gt",
    GREATER_THAN_EQUAL = "gte",
    BETWEEN = "between",
    NOT_BETWEEN = "not_between",
}

export type AVAILABLE_OPERATORS = `${FilterBooleanOperators | FilterDatetimeOperators | FilterNumberOperators | FilterStringOperators}`

const getFilterOperators = (fieldType: AVAILABLE_FIELD_TYPES): Array<AvailableFieldOperatorsInterface> => {
    let operators: Array<AvailableFieldOperatorsInterface> = [];
    switch (fieldType) {
        case "string":
            operators = [
                {value: FilterStringOperators.EQUAL_TO, label: "Equals TO", columns: 1},
                {value: FilterStringOperators.NOT_EQUAL_TO, label: "NOT Equals TO", columns: 1},
                {value: FilterStringOperators.IS_EMPTY, label: "Is Empty", columns: 0},
                {value: FilterStringOperators.IS_NOT_EMPTY, label: "Is Not Empty", columns: 0},
                {value: FilterStringOperators.STARTS_WITH, label: "Starts With", columns: 1},
                {value: FilterStringOperators.ENDS_WITH, label: "Ends With", columns: 1},
                {value: FilterStringOperators.CONTAINS, label: "Contains", columns: 1},
                {value: FilterStringOperators.INCLUDES, label: "Includes", columns: 1},
                {value: FilterStringOperators.NOT_INCLUDES, label: "Not Includes", columns: 1}
            ];
            break;
        case "number":
            operators = [
                {value: FilterNumberOperators.EQUAL_TO, label: "Equals TO", columns: 1},
                {value: FilterNumberOperators.NOT_EQUAL_TO, label: "NOT Equals TO", columns: 1},
                {value: FilterNumberOperators.IS_EMPTY, label: "Is Empty", columns: 0},
                {value: FilterNumberOperators.IS_NOT_EMPTY, label: "Is Not Empty", columns: 0},
                {value: FilterNumberOperators.LESS_THAN, label: "Less Than", columns: 1},
                {value: FilterNumberOperators.LESS_THAN_EQUAL, label: "Less Than Equals TO", columns: 1},
                {value: FilterNumberOperators.GREATER_THAN, label: "Greater Than", columns: 1},
                {value: FilterNumberOperators.GREATER_THAN_EQUAL, label: "Greater Than Equals TO", columns: 1},
                {value: FilterNumberOperators.BETWEEN, label: "In Between", columns: 2},
                {value: FilterNumberOperators.NOT_BETWEEN, label: "Not In Between", columns: 2},
                {value: FilterNumberOperators.INCLUDES, label: "Includes", columns: 1},
                {value: FilterNumberOperators.NOT_INCLUDES, label: "Not Includes", columns: 1}
            ];
            break;
        case "toggle":
            operators = [
                {value: FilterBooleanOperators.TOGGLE, label: "Toggle", columns: 1},
                {value: FilterBooleanOperators.IS_EMPTY, label: "Is Empty", columns: 0},
                {value: FilterBooleanOperators.IS_NOT_EMPTY, label: "Is Not Empty", columns: 0},
            ];
            break;
        case "datetime":
            operators = [
                {value: FilterDatetimeOperators.EQUAL_TO, label: "Equals TO", columns: 1},
                {value: FilterDatetimeOperators.NOT_EQUAL_TO, label: "NOT Equals TO", columns: 1},
                {value: FilterDatetimeOperators.IS_EMPTY, label: "Is Empty", columns: 0},
                {value: FilterDatetimeOperators.IS_NOT_EMPTY, label: "Is Not Empty", columns: 0},
                {value: FilterDatetimeOperators.LESS_THAN, label: "Less Than", columns: 1},
                {value: FilterDatetimeOperators.LESS_THAN_EQUAL, label: "Less Than Equals TO", columns: 1},
                {value: FilterDatetimeOperators.GREATER_THAN, label: "Greater Than", columns: 1},
                {value: FilterDatetimeOperators.GREATER_THAN_EQUAL, label: "Greater Than Equals TO", columns: 1},
                {value: FilterDatetimeOperators.BETWEEN, label: "In Between", columns: 2},
                {value: FilterDatetimeOperators.NOT_BETWEEN, label: "Not In Between", columns: 2},
            ];
            break;
        default:
            break;
    }
    return operators;
};

export interface LabelValueInterface {
    label: string;
    value: string;
}

export interface SortableFieldsInterface extends LabelValueInterface{}

export interface AvailableFieldOperatorsInterface extends LabelValueInterface{
    value: AVAILABLE_OPERATORS;
    columns: number;
}

export type AVAILABLE_FIELD_TYPES = "string" | "number" | "toggle" | "datetime";

export interface FilterableFieldsInterface {
    label: string;
    value: string;
    type: AVAILABLE_FIELD_TYPES;
    placeholder?: string;
    resource?: string;
}

export interface FilterableFieldsGroupInterface {
    title: string;
    fields: Array<FilterableFieldsInterface>;
}

export interface AppliedFiltersInterface {
    field: string;
    operator: AVAILABLE_OPERATORS | "";
    operators: Array<AvailableFieldOperatorsInterface>;
    query_1: any;
    query_2: any;
    placeholder?: any;
    columns: number;
    columnType: string;
}

export interface UseFilterableProps {
    endpoint: string;
    exportIdentifier?: string;
    exportEndpoint?: string;
    queryParams?: Array<Record<string, any>>;
}

export interface Meta {
    next_token: string|null;
}

export interface UseFilterableResult {
    loading: boolean,
    meta: Record<string, any>,
    records: Array<Record<string, any>>,
    exportRecords: () => void,
    fetchRecords: () => void,
    applyFilters: () => void,
    selectedFilters: Array<AppliedFiltersInterface>,
    sortColumn: (column: string) => void,
    removeSortColumn: (column: string) => void,
    resetSorting: () => void,
    addFilter: () => void,
    removeFilter: (value: AppliedFiltersInterface) => void,
    resetFilter: () => void,
    resetNextToken: () => void,
    onFilterColumnSelectHandler: (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement>) => void,
    onFilterOperatorSelectHandler: (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement>) => void,
    onFilterValueOneChangeHandler: (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement|HTMLInputElement>) => void,
    onFilterValueTwoChangeHandler: (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement|HTMLInputElement>) => void
}

const useFilter = (props: UseFilterableProps): UseFilterableResult => {
    const [loading, setLoading] = useState<boolean>(false);
    const [meta, setMeta] = useState<Meta>({next_token: null});
    const [records, setRecords] = useState<Array<Record<string, any>>>([]);
    const [selectedFilters, setSelectedFilters] = useState<Array<AppliedFiltersInterface>>([]);
    const [appliedSorts, setAppliedSorts] = useState<Record<string, any>>({});
    const [refresh, setRefresh] = useState<number>(0);
    const axios = useAuthenticatedAxios();

    const {endpoint, exportEndpoint, exportIdentifier, queryParams} = props;

    useEffect(() => {
        fetchRecords()
    }, [refresh]);

    const fetchRecords = async () => {
        setLoading(true)
        try {
            let params: Record<string, any> = buildQuery();

            const response = await axios.get(endpoint, {params: params});
            if(_get(response, "data.success", false)) {
                let response_devices = _get(response, "data.data.items", [])
                if ("next_token" in params) {
                    // For next page records we append the response items
                    if(response_devices.length) {
                        setRecords([...records, ...response_devices])
                    }
                } else {
                    // For First page records we create new array with response items
                    setRecords([...response_devices])
                }

                const next_token = _get(response, "data.data.next_token", null)
                setMeta({
                    ...meta,
                    ...{next_token: next_token}
                })
            }
        } catch (e) {

        }
        setLoading(false)
    };

    const exportRecords = async () => {
        if (exportEndpoint) {
            setLoading(true)
            try {
                let params: Record<string, any> = buildQuery();
                const data = {
                    "export_type": exportIdentifier,
                    "export_options": {
                        "filters": params["f"]? JSON.parse(params["f"]):[],
                        "sorting": []

                    }
                };
                await axios.post(exportEndpoint, data);
            } catch (e) {
            }
            setLoading(false)
        }
    };

    const buildQuery = () => {
        const f: Array<Record<string, any>> = [];
        selectedFilters.forEach((filter, i) => {
            if (filter.field && filter.field.length && filter.operator && filter.operator.length) {
                const obj: Record<string, any> = {
                    "column": filter.field,
                    "operator": filter.operator,
                    "query_1": null,
                    "query_2": null,
                }
                // f[`f[${i}][column]`] = filter.field;
                // f[`f[${i}][operator]`] = filter.operator

                if(filter.query_1 && Array.isArray(filter.query_1)) {
                    const list = filter.query_1.map((item) => {
                        return item.value;
                    });
                    obj["query_1"] = list.join(',,');
                    //f[`f[${i}][query_1]`] = list.join(',,');
                } else {
                    obj["query_1"] = filter.query_1;
                    //f[`f[${i}][query_1]`] = filter.query_1;
                }
                obj["query_2"] = filter.query_2;
                //f[`f[${i}][query_2]`] = filter.query_2;
                f.push(obj);
            }
        });
        const others: Record<string, any> = {}
        if("next_token" in meta && meta["next_token"]) {
            others["next_token"] = meta["next_token"]
        }
        return {
            ...queryParams,
            ...{"f": f.length? JSON.stringify(f): null},
            ...others
        };
    };

    const applyFilters = () => {
        resetNextToken();
        setRefresh((refresh) => refresh + 1)
    }

    const sortColumn = (column: string) => {
        if (column in appliedSorts) {
            appliedSorts[column] = appliedSorts[column] === "desc"? "asc":"desc"
        } else {
            appliedSorts[column] = "asc";
        }
    };

    const removeSortColumn = (column: string) => {
        if (column in appliedSorts) {
            delete appliedSorts[column]
        }
    };

    const resetSorting = () => {
        setAppliedSorts([]);
    }

    const addFilter = () => {
        setSelectedFilters([
            ...selectedFilters,
            {
                field: '',
                operator: '',
                operators: [],
                query_1: null,
                query_2: null,
                placeholder: null,
                columns: 1,
                columnType: "string"
            }
        ]);
    }

    const removeFilter = (value: AppliedFiltersInterface) => {
        setSelectedFilters(
            selectedFilters.filter((v) => {
                return v !== value
            })
        )
    }

    const resetFilter = () => {
        setSelectedFilters([]);
        resetNextToken()
        setRefresh((refresh) => refresh + 1)
    }

    const onFilterColumnSelectHandler = (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if(value.length<=0) {
            return;
        }
        const obj:FilterableFieldsInterface = JSON.parse(value);
        const filterOperators = getFilterOperators(obj.type);
        selectedFilters[i] = {
            field: obj.value,
            operator: filterOperators.length? filterOperators[0]?.value:"",
            operators: filterOperators,
            query_1: null,
            query_2: null,
            placeholder: obj.placeholder,
            columns: 1,
            columnType: obj.type
        };
        setSelectedFilters([
            ...selectedFilters
        ]);
    }

    const onFilterOperatorSelectHandler = (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if(value.length<=0) {
            return;
        }
        const obj:AvailableFieldOperatorsInterface = JSON.parse(value);
        const sf: AppliedFiltersInterface = selectedFilters[i];
        sf.operator = obj.value;
        sf.columns = obj.columns;
        selectedFilters[i] = sf;
        setSelectedFilters([
            ...selectedFilters
        ]);
    }

    const onFilterValueOneChangeHandler = (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement|HTMLInputElement>) => {
        const value = e.target.value;
        const sf: AppliedFiltersInterface = selectedFilters[i];
        if (f.columnType === "datetime") {
            sf.query_1 = moment(value).toISOString();
        } else {
            sf.query_1 = value;
        }
        selectedFilters[i] = sf;
        setSelectedFilters([
            ...selectedFilters
        ]);
    }

    const onFilterValueTwoChangeHandler = (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement|HTMLInputElement>) => {
        const value = e.target.value;
        const sf: AppliedFiltersInterface = selectedFilters[i];
        if (f.columnType === "datetime") {
            sf.query_2 = moment(value).toISOString();
        } else {
            sf.query_2 = value;
        }
        selectedFilters[i] = sf;
        setSelectedFilters([
            ...selectedFilters
        ]);
    }

    const resetNextToken = () => {
      setMeta((state) => ({
          ...meta,
          next_token: null
      }))
    };

    return {
        loading,
        meta,
        records,
        exportRecords,
        fetchRecords,
        applyFilters,
        selectedFilters,
        sortColumn,
        removeSortColumn,
        resetSorting,
        addFilter,
        removeFilter,
        resetFilter,
        resetNextToken,
        onFilterColumnSelectHandler,
        onFilterOperatorSelectHandler,
        onFilterValueOneChangeHandler,
        onFilterValueTwoChangeHandler
    }
};

export default useFilter;