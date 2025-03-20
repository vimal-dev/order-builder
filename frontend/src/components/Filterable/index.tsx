import React from "react";
import {Col, Form, Row, Spinner} from "react-bootstrap";
import "./style.scss";
import {
    AppliedFiltersInterface,
    FilterableFieldsGroupInterface,
    SortableFieldsInterface
} from "../../hooks/useFilter";
import {FaFileExport, FaFilter, FaPlus, FaSyncAlt} from "react-icons/fa";

export interface FilterableProps {
    sortableFields?: Array<SortableFieldsInterface>;
    filterableFields?: Array<FilterableFieldsGroupInterface>;
    queryParams: Array<Record<string, any>>;
    showFilterable: boolean;
    canExport: boolean;
    loading: boolean,
    exportRecords?: () => void,
    applyFilters: () => void,
    selectedFilters: Array<AppliedFiltersInterface>,
    sortColumn: (column: string) => void,
    removeSortColumn: (column: string) => void,
    resetSorting: () => void,
    addFilter: () => void,
    removeFilter: (value: AppliedFiltersInterface) => void,
    resetFilter: () => void,
    onFilterColumnSelectHandler: (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement>) => void,
    onFilterOperatorSelectHandler: (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement>) => void,
    onFilterValueOneChangeHandler: (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement|HTMLInputElement>) => void,
    onFilterValueTwoChangeHandler: (f: AppliedFiltersInterface, i: number, e: React.ChangeEvent<HTMLSelectElement|HTMLInputElement>) => void
}


const Filterable: React.FC<FilterableProps> = (props) => {
    const {
        filterableFields,
        showFilterable,
        canExport,
        exportRecords,
        loading,
        selectedFilters,
        applyFilters,
        addFilter,
        removeFilter,
        resetFilter,
        onFilterColumnSelectHandler,
        onFilterOperatorSelectHandler,
        onFilterValueOneChangeHandler,
        onFilterValueTwoChangeHandler
    } = props;

    return <>
        <div className="filterable">
            {showFilterable &&
                <div className="filters">
                    <Row>
                        <Col>
                            <div className="filters-title pt-4 pb-2 mb-2">
                                <span>Records matching</span>
                                {/* <select className="form-control form-control-sm">
                                    <option value="and">All</option>
                                    <option value="or">Any</option>
                                </select>
                                <span>Of the following</span> */}
                            </div>
                            <div className="filters filter-conditions">
                                {selectedFilters.map((f, index) => (
                                    <div className="filters-item mb-2" key={`filter-${index}`}>
                                        <div className="filters-column float-start">
                                            <select className="form-select" onChange={(e) => onFilterColumnSelectHandler(f, index, e)}>
                                                <>
                                                    <option value="">Select Filter</option>
                                                    {filterableFields?.map((group, gk) => {
                                                        return <>
                                                            <optgroup label={group.title} key={`group-${index}-${gk}`}>
                                                                {group.fields.map((field, fk) => <option value={JSON.stringify(field)} key={`group-${index}-${gk}-${fk}`}>{field.label}</option>)}
                                                            </optgroup>
                                                        </>
                                                    })}
                                                </>
                                            </select>
                                        </div>
                                        <div className="filters-operator float-start">
                                            <select className="form-select" onChange={(e) => onFilterOperatorSelectHandler(f, index, e)}>
                                                <>
                                                    <option value="">Select Operator</option>
                                                    {f.operators.map((operator, ok) => <option value={JSON.stringify(operator)} key={`group-${f.field}-${ok}`}>{operator.label}</option>)}
                                                </>
                                            </select>
                                        </div>
                                        {f.columns === 0 &&
                                            <>
                                                <div className="filters-empty float-start">
                                                </div>
                                            </>
                                        }
                                        {f.columns === 1 &&
                                            <>
                                                <div className="filters-full float-start">
                                                    {f.columnType === "string" &&
                                                        <input onChange={(e) => onFilterValueOneChangeHandler(f, index, e)} type="text" className="form-control" placeholder={f.placeholder}/>
                                                    }
                                                    {f.columnType === "number" &&
                                                        <input onChange={(e) => onFilterValueOneChangeHandler(f, index, e)} type="number" className="form-control" placeholder={f.placeholder}/>
                                                    }
                                                    {f.columnType === "datetime" &&
                                                        <input onChange={(e) => onFilterValueOneChangeHandler(f, index, e)} type="datetime-local" step="1" className="form-control" placeholder={f.placeholder}/>
                                                    }
                                                    {f.columnType === "toggle" &&
                                                        <Form.Check
                                                            type="switch"
                                                            id="custom-switch"
                                                            label={f.placeholder}
                                                            onChange={(e) => onFilterValueOneChangeHandler(f, index, e)}
                                                        />
                                                    }
                                                </div>
                                            </>
                                        }
                                        {f.columns === 2 &&
                                            <>
                                                <div className="filters-query_1 float-start">
                                                    {f.columnType === "string" &&
                                                        <input onChange={(e) => onFilterValueOneChangeHandler(f, index, e)} type="text" className="form-control" placeholder={f.placeholder}/>
                                                    }
                                                    {f.columnType === "number" &&
                                                        <input onChange={(e) => onFilterValueOneChangeHandler(f, index, e)} type="number" className="form-control" placeholder={f.placeholder}/>
                                                    }
                                                    {f.columnType === "datetime" &&
                                                        <input onChange={(e) => onFilterValueOneChangeHandler(f, index, e)} type="datetime-local" step="1" className="form-control" placeholder={f.placeholder}/>
                                                    }
                                                    {f.columnType === "toggle" &&
                                                        <select onChange={(e) => onFilterValueOneChangeHandler(f, index, e)} className="form-select">
                                                            <option value="">{f.placeholder}</option>
                                                            <option value="1">True/Yes</option>
                                                            <option value="0">False/No</option>
                                                        </select>
                                                    }
                                                </div>
                                                <div className="filters-query_2 float-start">
                                                    {f.columnType === "string" &&
                                                        <input onChange={(e) => onFilterValueTwoChangeHandler(f, index, e)} type="text" className="form-control" placeholder={f.placeholder}/>
                                                    }
                                                    {f.columnType === "number" &&
                                                        <input onChange={(e) => onFilterValueTwoChangeHandler(f, index, e)} type="number" className="form-control" placeholder={f.placeholder}/>
                                                    }
                                                    {f.columnType === "datetime" &&
                                                        <input onChange={(e) => onFilterValueTwoChangeHandler(f, index, e)} type="datetime-local" step="1" className="form-control" placeholder={f.placeholder}/>
                                                    }
                                                    {f.columnType === "toggle" &&
                                                        <select onChange={(e) => onFilterValueTwoChangeHandler(f, index, e)} className="form-select">
                                                            <option value="">{f.placeholder}</option>
                                                            <option value="1">True/Yes</option>
                                                            <option value="0">False/No</option>
                                                        </select>
                                                    }
                                                </div>
                                            </>
                                        }
                                        <div className="filters-remove-wrap float-start">
                                            <button title={'Remove Filter'} className="filters-remove btn btn-sm btn-outline-danger" disabled={loading} onClick={() => removeFilter(f)}>
                                                <i className="fa fa-trash-alt"></i> X
                                            </button>
                                        </div>
                                        <div className="clearfix"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="filters-control">
                                <div className="filters-control-item">
                                    <button title={'Add New Filter'} type="button" className="btn btn-sm btn-outline-secondary" disabled={loading} onClick={(_e) => addFilter()}><FaPlus /></button>
                                </div>
                                {selectedFilters && (
                                    <>
                                        {selectedFilters.length > 0 && (
                                            <div className="filters-control-item">
                                                <div className="filters-control-item-line"></div>
                                                <button title={'Remove Filters'} type="button" className="btn btn-sm btn-outline-secondary" disabled={loading} onClick={(_e) => resetFilter()}><FaSyncAlt /></button>
                                            </div>
                                        )}
                                        <div className="filters-control-item">
                                            <div className="filters-control-item-line"></div>
                                            <button title={'Filter Records'} type="button" className="btn btn-sm btn-outline-secondary" disabled={loading} onClick={(_e) => {applyFilters()}}>
                                                {loading && <Spinner size={"sm"}></Spinner>}
                                                {!loading && <FaFilter />}
                                            </button>
                                        </div>
                                        {(exportRecords && canExport) && (
                                            <div className="filters-control-item">
                                                <div className="filters-control-item-line"></div>
                                                <button title={'Export Filtered Records'} type="button" className="btn btn-sm btn-outline-secondary" disabled={loading} onClick={(_e) => {exportRecords()}}>
                                                    {loading && <Spinner size={"sm"}></Spinner>}
                                                    {!loading && <FaFileExport />}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </Col>
                    </Row>
                </div>
            }
        </div>
    </>
}

export default Filterable;